"use strict";
const fs = require("fs");
const path = require("path");
const { create } = require("xmlbuilder2");
const {
  ficsKeyMapping,
  transformToXML,
  sanitize,
  getValueFromPath,
} = require("./helpers/convertFICSToXML");
const { error } = require("console");
const { Parser } = require("json2csv");
const {
  episysKeyMapping,
  transformToCSV,
} = require("./helpers/convertEpisysToCSV");
const { uploadToSFTP, testSFTPConnection } = require("./helpers/sftpUploader");

module.exports.convertFICSToXML = async (event) => {
  try {
    const isTest = event.headers["X-TEST"] || event.headers["x-test"];
    if (isTest) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "This is a test request",
        }),
      };
    }

    // Test SFTP connection before continuing
    const sftpTest = await testSFTPConnection();
    if (!sftpTest.success) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "Failed to connect to SFTP server.",
        }),
      };
    }
    const sftp = sftpTest.sftp;

    const body = JSON.parse(event.body);
    if (!Array.isArray(body)) {
      body = [body];
    }
    // Create local tmp folder in project if not exists
    const tmpDir = path.join(__dirname, "tmp");
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }

    const results = [];

    for (const loanData of body) {
      const loanId = loanData.loanId || "";
      const doc = create({ version: "1.0", encoding: "UTF-8" }).ele("data");

      for (const [sectionName, fields] of Object.entries(ficsKeyMapping)) {
        if (fields.loop && fields.fields) {
          const loopArray = transformToXML(loanData, fields.loop);
          if (Array.isArray(loopArray)) {
            const parent = doc.ele(sectionName);
            loopArray.forEach((entry) => {
              const child = parent.ele("borrower");
              for (const [fieldName, pathOrFn] of Object.entries(
                fields.fields
              )) {
                const value =
                  typeof pathOrFn === "function"
                    ? pathOrFn(entry)
                    : getValueFromPath(entry, pathOrFn);
                child.ele(sanitize(fieldName)).txt(String(value ?? ""));
              }
            });
          }
        } else {
          // Regular single-entry sections
          const section = doc.ele(sectionName);
          for (const [fieldName, pathOrFn] of Object.entries(fields)) {
            const value = transformToXML(loanData, pathOrFn);
            section.ele(sanitize(fieldName)).txt(String(value ?? ""));
          }
        }
      }

      const xml = doc.end({ prettyPrint: true });
      const fileName = `${
        loanId ? loanId + "-" : ""
      }loan-fics-${Date.now()}.xml`;
      const filePath = path.join(tmpDir, fileName);

      fs.writeFileSync(filePath, xml);

      let uploadResult = {};
      try {
        uploadResult = await uploadToSFTP(sftp, filePath, "fics", fileName);
      } catch (err) {
        console.log("Upload failed: ", error);
        uploadResult = {
          success: false,
          error: "Upload failed: " + (err.message || err),
        };
      }

      // Clean up tmp file
      try {
        fs.unlinkSync(filePath);
      } catch (unlinkErr) {
        console.warn(
          `Failed to delete tmp file ${fileName}:`,
          unlinkErr.message
        );
      }

      results.push({
        loanId,
        success: uploadResult.success,
        fileName: uploadResult.fileName,
        remotePath: uploadResult.remotePath,
        localPath: filePath,
        error: uploadResult.error || null,
      });
    }
    await sftp.end();

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "FICS XML(s) generated and uploaded",
        results,
      }),
    };
  } catch (error) {
    return {
      error: "An unexpected error occurred while converting FICS into XML.",
      details: error.message || error,
    };
  }
};

module.exports.convertEpisysToCSV = async (event) => {
  try {
    const isTest = event.headers?.["X-TEST"] || event.headers?.["x-test"];
    if (isTest) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "This is a test request",
        }),
      };
    }

    // Test SFTP connection before continuing
    const sftpTest = await testSFTPConnection();
    if (!sftpTest.success) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "Failed to connect to SFTP server.",
        }),
      };
    }
    const sftp = sftpTest.sftp;

    let body = JSON.parse(event.body);
    if (!Array.isArray(body)) {
      body = [body];
    }

    // Convert each loan into a flat object with values from episysKeyMapping
    const rows = body.map((loanData) =>
      transformToCSV(loanData, episysKeyMapping)
    );

    // Create CSV
    const fields = Object.keys(episysKeyMapping);
    const parser = new Parser({ fields });
    const csv = parser.parse(rows);

    // Save CSV to tmp folder
    const tmpDir = path.join(__dirname, "tmp");
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }

    let loanId = body[0].loanId || body[0].id || null;

    // const fileName = `loans-${Date.now()}.csv`;
    const fileName = `${
      loanId ? loanId + "-" : ""
    }loan-episys-${Date.now()}.csv`;
    const filePath = path.join(tmpDir, fileName);
    fs.writeFileSync(filePath, csv);

    // Upload CSV to SFTP
    let uploadResult = {};
    try {
      uploadResult = await uploadToSFTP(sftp, filePath, "episys", fileName);
    } catch (err) {
      console.error("Upload failed: ", err);
      uploadResult = {
        success: false,
        error: "Upload failed: " + (err.message || err),
      };
    }

    await sftp.end();

    // Clean up tmp file
    try {
      fs.unlinkSync(filePath);
    } catch (unlinkErr) {
      console.warn(`Failed to delete tmp file ${fileName}:`, unlinkErr.message);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "CSV generated and uploaded",
        fileName: uploadResult.fileName,
        remotePath: uploadResult.remotePath,
        success: uploadResult.success,
        error: uploadResult.error || null,
      }),
    };
  } catch (error) {
    console.error("Handler error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "An unexpected error occurred while generating CSV.",
        details: error.message || error,
      }),
    };
  }
};

module.exports.convertARCUToJSON = async (event) => {
  try {
    const isTest = event.headers["X-TEST"] || event.headers["x-test"];
    if (isTest) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "This is a test request",
        }),
      };
    }

    const body = JSON.parse(event.body);
    if (!Array.isArray(body)) {
      body = [body];
    }

    // Test SFTP connection before continuing
    const sftpTest = await testSFTPConnection();
    if (!sftpTest.success) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "Failed to connect to SFTP server.",
        }),
      };
    }
    const sftp = sftpTest.sftp;

    // Create tmp folder if not exists
    const tmpDir = path.join(__dirname, "tmp");
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }

    const results = [];

    for (const [index, entry] of body.entries()) {
      const loanId = entry.loanId || "";
      const fileName = `${loanId}-arcu-${Date.now()}.json`;
      const filePath = path.join(tmpDir, fileName);

      fs.writeFileSync(filePath, JSON.stringify(entry, null, 2));

      const uploadResult = await uploadToSFTP(sftp, filePath, "arcu", fileName);

      results.push({
        loanId,
        success: uploadResult.success,
        fileName: uploadResult.fileName,
        remotePath: uploadResult.remotePath,
        localPath: filePath,
        error: uploadResult.error || null,
      });

      // Clean up tmp file
      try {
        fs.unlinkSync(filePath);
      } catch (unlinkErr) {
        console.warn(
          `Failed to delete tmp file ${fileName}:`,
          unlinkErr.message
        );
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "ARCU JSON(s) received and uploaded to SFTP",
        results,
      }),
    };
  } catch (error) {
    return {
      error: "An unexpected error occurred while ARCU into json.",
      details: error.message || error,
    };
  }
};
