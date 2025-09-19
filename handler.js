"use strict";
const fs = require("fs");
const path = require("path");
const { create } = require("xmlbuilder2");
const { keyMapping, transformToXML } = require("./helpers/convertFICSToXML");
const { uploadToSFTP } = require("./helpers/sftpUploader");

module.exports.convertFICSToXML = async (event) => {
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
  const doc = create({ version: "1.0" }).ele("Loan");

  for (const [ficsField, sourcePath] of Object.entries(keyMapping)) {
    const value = transformToXML(body, sourcePath);
    doc.ele(ficsField).txt(String(value)); // No sanitization
  }

  const xml = doc.end({ prettyPrint: true });

  // Create local tmp folder in project if not exists
  const tmpDir = path.join(__dirname, "tmp");
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }

  const filePath = path.join(tmpDir, `loan-fics-${Date.now()}.xml`);
  fs.writeFileSync(filePath, xml);

  const uploadResult = await uploadToSFTP(filePath, "FICS");

  if (!uploadResult.success) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Failed to upload FICS XML file to SFTP",
        details: uploadResult.error,
      }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "FICS XML generated and uploaded to SFTP",
      fileName: uploadResult.fileName,
      remotePath: uploadResult.remotePath,
      path: filePath,
    }),
  };
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

    // Create local tmp folder in project if not exists
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

      const uploadResult = await uploadToSFTP(filePath, "ARCU");

      results.push({
        loanId,
        success: uploadResult.success,
        fileName: uploadResult.fileName,
        remotePath: uploadResult.remotePath,
        localPath: filePath,
        error: uploadResult.error || null,
      });
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
