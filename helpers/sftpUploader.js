const SftpClient = require("ssh2-sftp-client");
const config = require("../config");

const sftpConfig = {
  host: config.host,
  port: config.port,
  username: config.username,
  privateKey: config.privateKey,
  passphrase: config.password,
};

async function testSFTPConnection() {
  const sftp = new SftpClient();
  try {
    await sftp.connect(sftpConfig);
    return { success: true, sftp };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function uploadToSFTP(
  sftp,
  localFilePath,
  subFolder = "", // "fics" or "episys" or "arcu"
  remoteFileName = null
) {
  try {
    const fileName = remoteFileName || localFilePath.split("/").pop();
    const fullRemoteDir = `${subFolder}`;
    const remotePath = `${fullRemoteDir}/${fileName}`;

    // Make directory if it doesn't exist
    try {
      await sftp.mkdir(fullRemoteDir, true);
    } catch (mkdirErr) {
      if (!mkdirErr.message.includes("Failure")) throw mkdirErr;
    }

    await sftp.put(localFilePath, remotePath);
    return { success: true, fileName, remotePath };
  } catch (error) {
    console.error("SFTP Upload Error:", error.message);
    return { success: false, error: error.message };
  }
}

module.exports = { uploadToSFTP, testSFTPConnection };
