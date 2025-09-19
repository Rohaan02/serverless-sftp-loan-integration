# 📌 LandingPad Serverless SFTP Loan Integration

This project implements a **Serverless SFTP integration service** that receives loan updates from **LendingPad**, transforms the JSON data into **endpoint-specific files**, and securely uploads them to three different SFTP servers:

- **FICS** – generates **XML files** for mortgage servicing
- **Arcu** – generates **JSON files** for analytics/archival
- **Episys** – generates **CSV files** for core banking

---

## 🔹 Key Features

- **Data Transformation:** Converts LendingPad JSON export into XML, CSV, or JSON formats based on endpoint.
- **Multi-endpoint Support:** Handles SFTP destinations for FICS, Arcu, and Episys.
- **Serverless Architecture:** Built with AWS Lambda for scalability and cost-efficiency.
- **Flexible Mapping:** Uses a dynamic `keyMapping` configuration with string paths, functions, and multi-field merges.
- **Secure File Transfer:** Uploads generated files to respective SFTP servers using unique credentials.
- **Extensible Design:** Easily add new endpoints or adjust existing mappings.

---

## 🔹 Workflow

1. Receive JSON payload from LendingPad (via API Gateway).
2. Transform the JSON into endpoint-specific files:
   - **FICS** → XML
   - **Episys** → CSV
   - **Arcu** → JSON
3. Store files temporarily (local or S3).
4. Upload to respective SFTP servers.
5. Return status response.

---

## 🔧 Environment Setup (Node.js v20 + Serverless v3.39)

### 1. Install Node.js v20 using nvm

```bash
nvm install 20
nvm use 20
```

### 2. Install Serverless Framework CLI (v3.39.0)

```bash
npm install -g serverless@3.39.0
```

### 3. Create a Serverless project in the current directory

```bash
serverless create --template aws-nodejs
```

### 4. Initialize npm and install dependencies

```bash
npm init -y
```

### 5. Install local development dependencies

```bash
npm install --save-dev serverless-offline
```

---

## 📦 Required Dependencies

Install the necessary production packages:

```bash
npm install axios dotenv lambda-multipart-parser busboy ssh2-sftp-client xmlbuilder2
```

---

## 📁 Project Structure

```
.
├── handler.js
├── helpers/
│   └── xmlFormatter.js
├── serverless.yml
├── .env
└── package.json
```

---

## 📄 helpers/xmlFormatter.js

This helper reformats LendingPad loan JSON into endpoint-compatible files using a key mapping object.

- FICS: XML generator

- Episys: CSV generator

- Arcu: JSON generator

---

## 🛡️ Security

- All file transfers use SFTP (Secure File Transfer Protocol) over SSH.

- Credentials are managed via environment variables and never hardcoded.

- Temporary files can be stored in AWS S3 with encryption.

---

## 🚀 Running Locally

To run your Lambda function locally with Serverless Offline:

```bash
serverless offline
```

## 📂 Deployment

Deploy to AWS with:

```bash
serverless offline
```

---

Let me know if you need full example code for `handler.js`, or want to split the XML into sections (GL, Balancing, etc.).

---

# ✨ Author

👨‍💻 **Developed by [Rohaan Nadeem](https://github.com/rohaan02)**

📧 [Email](mailto:rohaannadeem2@gmail.com)  
🐙 [GitHub](https://github.com/rohaan02)  
🔗 [LinkedIn](https://www.linkedin.com/in/rohaannadeem/)  
🌐 [Portfolio](https://rohaan02.github.io/)
