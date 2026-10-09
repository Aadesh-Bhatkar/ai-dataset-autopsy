/**
 * Generates an educational synthetic customer analytics dataset.
 * Designed to demonstrate data quality problems, outliers, duplicates,
 * missing values, inconsistency, class imbalance, and data leakage risks.
 */

export function generateSampleDatasetCSV(): string {
  const headers = [
    'customer_id',
    'customer_age',
    'annual_income',
    'credit_score',
    'tenure_months',
    'gender',
    'employment_status',
    'city',
    'country',
    'monthly_charges',
    'cancellation_survey_score',
    'churned'
  ];

  const cities = ['New York', 'New York', 'Chicago', 'Austin', 'Seattle', 'San Francisco', 'Miami'];
  const casingQuirks = ['New York', ' New York ', 'new york', 'Chicago', 'chicago', 'Austin', 'austin', 'Seattle', 'Seattle '];
  const employments = ['Employed', 'Self-Employed', 'Unemployed', 'Student', 'Retired'];
  const genders = ['Female', 'Male', 'Non-Binary', 'Prefer not to say'];

  const rows: string[] = [];
  rows.push(headers.join(','));

  const baseCount = 120;

  for (let i = 1; i <= baseCount; i++) {
    const id = `CUST-${1000 + i}`;
    
    // Normal age distribution with deliberate outliers
    let age: number | string = Math.floor(22 + Math.random() * 45);
    if (i === 14) age = 142; // Outlier: impossible biological age
    if (i === 42) age = -5;  // Outlier: negative age defect
    if (i === 78) age = 105; // Outlier: extreme high age

    // Normal income with some missingness and extreme outliers
    let income: number | string = Math.floor(35000 + Math.random() * 75000);
    if (i % 9 === 0) income = ''; // Missing value
    if (i === 7) income = 2850000; // Extreme high outlier (multi-millionaire)
    if (i === 63) income = 1500000; // Extreme outlier

    // Credit score (300 - 850) with some missing
    let credit: number | string = Math.floor(580 + Math.random() * 240);
    if (i % 12 === 0) credit = ''; // Missing value

    const tenure = Math.floor(1 + Math.random() * 70);

    const gender = genders[Math.floor(Math.random() * genders.length)];

    let employment = employments[Math.floor(Math.random() * employments.length)];
    if (i % 15 === 0) employment = ''; // Missing categorical

    // City with intentional leading/trailing spaces and mixed casing
    const city = casingQuirks[Math.floor(Math.random() * casingQuirks.length)];

    // Nearly constant column: Country is almost always US
    const country = i === 50 ? 'CA' : 'US';

    let monthlyCharges: number | string = Math.round((25 + Math.random() * 110) * 100) / 100;
    if (i === 33) monthlyCharges = 999.99; // Outlier

    // Target: churned (Imbalanced ~15% churn rate)
    const isChurned = (i % 7 === 0 || i === 7 || i === 14 || i === 33) ? 1 : 0;

    // ML Leakage Risk: cancellation_survey_score only exists when customer churned!
    // Highly predictive because it's only recorded post-cancellation event
    let cancelScore: string | number = '';
    if (isChurned === 1) {
      cancelScore = Math.floor(1 + Math.random() * 3); // Low ratings 1-3
    } else if (i === 20) {
      cancelScore = 4; // occasional false capture
    }

    const row = [
      id,
      age,
      income,
      credit,
      tenure,
      `"${gender}"`,
      employment ? `"${employment}"` : '',
      `"${city}"`,
      `"${country}"`,
      monthlyCharges,
      cancelScore,
      isChurned
    ];

    rows.push(row.join(','));
  }

  // Inject intentional exact duplicate rows to demonstrate duplicate detection!
  // Duplicate row 10
  rows.push(rows[10]);
  rows.push(rows[10]);
  // Duplicate row 25
  rows.push(rows[25]);

  return rows.join('\n');
}
