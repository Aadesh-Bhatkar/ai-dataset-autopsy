# AI Dataset Autopsy — Intelligent Data Quality Analyzer

> **"Investigate your data. Discover hidden problems. Prepare better datasets."**

An educational Data Science portfolio application engineered to diagnose tabular CSV datasets before training machine learning models. Built with React, Vite, Tailwind CSS, PapaParse, Recharts, and Google Gemini.

---

## 🌟 Key Features

* **100% In-Browser Local Profiling:** CSV parsing, statistical calculations, and anomaly evaluations run entirely in the browser. Zero raw records or PII are uploaded to remote servers.
* **Automatic Data Profiling:** Infers column types (`Integer`, `Decimal`, `Categorical`, `Boolean`, `Date`, `Identifier-like`, `Text`) and computes full descriptive statistics (Min, Max, Mean, Median, Std Dev, Q1, Q3, IQR, Cardinality).
* **Missing Value Investigation:** Calculates cell-level missingness, classifies descriptive severity, and advises on domain-appropriate imputation (Median, Mean, Mode, or indicator flags).
* **Deduplication Matrix:** Identifies exact row duplicates across all features or user-selected subsets. Create deduplicated copies non-destructively.
* **Tukey's IQR Outlier Detection:** Screens numeric features with IQR fencing ($Q_1 - 1.5\times IQR$ to $Q_3 + 1.5\times IQR$) with educational caveats against blind deletion.
* **Consistency & Whitespace Audit:** Detects trailing spaces, mixed category casing (e.g. `"New York"` vs `"new york"`), zero-variance columns, and includes a configurable domain validator.
* **Target & Class Imbalance Analysis:** Evaluates class distributions, majority-to-minority ratios, and recommends Stratified splits and cross-validation resampling safeguards.
* **ML Data Leakage Risk Review:** Flags retrospective attributes, target-proxy correlations, and operational features unavailable at inference time.
* **Interactive Cleaning Workspace:** Non-destructive in-memory workbench to trim spaces, fix casing, impute missing values, and filter records with full Undo and CSV download.
* **Ask Your Dataset (AI Data Analyst):** Gemini-powered natural language explanations constrained strictly to verified computed statistics. If no API key is provided, an intelligent local rule-based engine operates automatically.
* **Exportable Reports:** One-click download of interactive HTML reports (printable to PDF), Markdown documentation, and cleaned CSVs.

---

## 🚀 Quickstart Guide

### 1. Prerequisites (Install Node.js)
Ensure you have **Node.js** (v18.0 or newer) installed on your system.
* Download from [nodejs.org](https://nodejs.org/) or install via your system package manager.
* Verify your installation:
  ```bash
  node -v
  npm -v
  ```

### 2. Open Project in VS Code
1. Open your terminal.
2. Navigate to the project directory and launch VS Code:
  ```bash
  code .
  ```

### 3. Install Dependencies
```bash
npm install
```

### 4. Configure Environment Variables (Optional)
The core analysis and profiling run 100% locally and **do not require any API keys**.
To enable Gemini AI natural language chat explanations:
1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Add your Gemini API key:
   ```env
   GEMINI_API_KEY="your_api_key_here"
   ```

### 5. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing with the Synthetic Dataset

Click the prominent **"Try Sample Dataset"** button on the homepage or header.
This loads an educational customer analytics dataset (124 rows, 12 columns) containing deliberate, realistic data quality challenges:
1. **Missing values:** `annual_income`, `credit_score`, and `employment_status`.
2. **Duplicate rows:** Rows 11, 12, and 26.
3. **Outliers:** Customer age of 142 and -5; annual income of $2,850,000; monthly charges of $999.99.
4. **Casing & whitespace:** `city` column containing `" New York "`, `"new york"`, and `"Austin"`.
5. **Class Imbalance:** `churned` target column with an ~85% to 15% class ratio.
6. **Data Leakage Risk:** `cancellation_survey_score` column collected only after customer churned.

---

## 📂 Uploading Your Own CSV

1. Navigate to **Upload Dataset** in the sidebar.
2. Drag and drop your `.csv` file or click **Browse File**.
3. The dataset will be parsed locally by PapaParse and profiled immediately.

---

## ☁️ Deploying to Vercel

1. Push your repository to GitHub, GitLab, or Bitbucket.
2. Log into [vercel.com](https://vercel.com) and click **"Add New Project"**.
3. Import your Git repository.
4. Framework Preset: **Vite**.
5. Build Command: `npm run build`
6. Output Directory: `dist`
7. (Optional) Add `GEMINI_API_KEY` under **Environment Variables** if you wish to use remote AI explanations.
8. Click **Deploy**.

To redeploy after making changes:
```bash
git add .
git commit -m "Enhance data quality audit checks"
git push origin main
```
Vercel will automatically build and deploy the updated application.

---

## 🔒 Privacy & Security Architecture

* **Local-First Processing:** PapaParse parses files in the client session.
* **No Telemetry / No Raw Data Upload:** Raw CSV rows are never transmitted across the network.
* **Aggregated AI Prompts:** Inquiries sent to the AI service reference only aggregated mathematical summaries (e.g. column names, missing percentages, IQR fence values). No personal data or identifiable observations are shared.
* **Offline Resilient:** The application remains 100% functional without an internet connection or Gemini API credentials.

---

## 📄 License
Apache-2.0 License. Designed for educational Data Science portfolio demonstrations.
