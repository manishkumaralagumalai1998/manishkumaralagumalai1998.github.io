// Everything on the site comes from Manishkumar's resume. Edit here to update the page.

export const LINES = {
  school: { name: 'B.E.', when: '2015 – 2019', color: 'var(--l-school)' },
  presidio: { name: 'Presidio', when: 'May 2019 – May 2023', color: 'var(--l-presidio)' },
  iu: { name: 'Indiana U.', when: '2023 – 2025', color: 'var(--l-iu)' },
  radcube: { name: 'Radcube', when: 'Nov 2025 – now', color: 'var(--l-radcube)' },
}

export const SKILLS = {
  ai: 'AI & LLMs',
  react: 'React',
  angular: 'Angular',
  python: 'Python & FastAPI',
  node: 'Node.js',
  cloud: 'AWS & Azure',
  data: 'Data platforms',
}

export const STOPS = [
  {
    id: 'velammal', line: 'school', name: 'Velammal', tag: 'B.E. CSE',
    title: 'Computer Science and Engineering',
    meta: [['Where', 'Velammal College of Engineering and Technology (Anna University)'], ['Graduated', 'Apr 2019']],
    problem: "Where the line starts: a bachelor's in computer science, then straight into Presidio as a software engineer.",
    built: [], big: 'B.E.', bigLabel: 'Computer Science and Engineering', more: [], stack: [], with: '', skills: [],
  },
  {
    id: 'sbsd', line: 'presidio', name: 'Virginia', tag: 'SWaM portal',
    title: "Virginia's SWaM certification platform",
    meta: [['Client', 'Commonwealth of Virginia'], ['Role', 'Project lead'], ['Length', '18 months']],
    problem: 'Virginia certifies small, women- and minority-owned (SWaM) businesses so they can compete for state contracts. Applicants clicked through a 5-page form, and the platform ran on AngularJS with Node.js functions nested 10+ callbacks deep.',
    built: [
      'Rebuilt the 5-page application as a progress-tracked wizard, with conditional sections in Angular Reactive Forms and one reusable modal framework',
      'Migrated from AngularJS to Angular 10 and broke callback chains into reusable async/await modules, taking files from 1,000+ lines to about 200',
      'Shipped officer-requested features such as recertification emails 60 and 30 days before expiry',
    ],
    big: '75%', bigLabel: 'fewer clicks to apply (32+ → ~8)',
    more: [['5×', 'smaller files after the rewrite'], ['35+', 'sprint demos with state officers']],
    stack: ['Angular', 'Node.js', 'IBM DB2', 'AWS'],
    with: "Led a 4-person team (2 developers, QA, product owner) alongside Virginia's SWaM officers",
    skills: ['angular', 'node', 'cloud'],
  },
  {
    id: 'ava', line: 'presidio', name: 'Autodesk', tag: 'AVA chatbot',
    title: "AVA, Autodesk's guided chatbot",
    meta: [['Client', 'Autodesk'], ['Role', 'Full-stack developer; sole developer of the builder']],
    problem: 'AVA routed users to the help desk, recommended the right Autodesk product, and sent buyers to checkout. Each new workflow took developers about a week of manual IBM Watson setup.',
    built: [
      'Independently built a React Flow conversation builder with 8+ drag-and-drop node types, so designers could build, test and deploy flows to IBM Watson or Rasa themselves',
      "Shaped it with Autodesk's lead developers",
      "Held the app above Autodesk's quality thresholds, earning Bronze in its three-tier program",
    ],
    big: '5×', bigLabel: 'faster to ship a workflow (a week → under a day)',
    more: [['5 → 12', 'live workflows'], ['Bronze', 'quality certification']],
    stack: ['React', 'React Flow', 'Node.js', 'Spring Boot', 'IBM Watson', 'Rasa'],
    with: "A 5-person chatbot team and Autodesk's lead developers",
    skills: ['ai', 'react', 'node'],
  },
  {
    id: 'card', line: 'presidio', name: 'card.com', tag: 'Card ordering',
    title: 'Custom card design and ordering',
    meta: [['Client', 'card.com'], ['Role', 'Full-stack developer']],
    problem: 'card.com lets people design and order their own printed debit and credit cards.',
    built: ['React and TypeScript components for designing and ordering a card', 'Stripe checkout', "The GraphQL API's inputs and mutations, with Prisma as the data layer"],
    big: '6+', bigLabel: 'data models behind the GraphQL API', more: [['End to end', 'from UI to API']],
    stack: ['React', 'TypeScript', 'GraphQL', 'Prisma', 'Stripe'], with: '', skills: ['react'],
  },
  {
    id: 'sixconnex', line: 'presidio', name: '6connex', tag: 'Event chat',
    title: 'Messaging for virtual events',
    meta: [['Client', '6connex'], ['Role', 'Backend developer']],
    problem: 'Events needed chat with channels, groups, one-to-one messages and moderators. It was our first build on Amazon Chime messaging.',
    built: ['A serverless backend: Lambda functions behind API Gateway, deployed with AWS CDK, on Amazon Chime SDK Messaging'],
    big: '5', bigLabel: 'capabilities: channels, groups, 1:1, members, moderation', more: [],
    stack: ['Node.js', 'AWS CDK', 'Lambda', 'API Gateway', 'Chime SDK'], with: '', skills: ['node', 'cloud'],
  },
  {
    id: 'tron', line: 'presidio', name: 'Disney', tag: 'TRON access',
    title: 'TRON, access onboarding at Disney',
    meta: [['Client', 'Disney'], ['Role', "Led the portal's development"]],
    problem: 'When someone joined a team, their manager emailed each support team for access to Slack, Jira, Outlook, AWS and more, then chased every request by hand.',
    built: ['A self-service portal: one request covers every app a person needs', '10+ REST APIs that trigger Airflow DAGs, routing each request to the right support team', 'A request closes only once every access is granted'],
    big: '80%', bigLabel: 'less manual coordination for managers',
    more: [['10+', 'support teams per request'], ['10+', 'REST APIs']],
    stack: ['React', 'FastAPI', 'Airflow', 'Docker'],
    with: 'A joint 6-engineer Presidio and Disney team, with Disney stakeholders',
    skills: ['react', 'python', 'data'],
  },
  {
    id: 'iu', line: 'iu', name: 'Indiana U.', tag: 'M.S. ISE',
    title: 'M.S., Intelligent Systems Engineering',
    meta: [['Where', 'Indiana University Bloomington'], ['When', 'Aug 2023 – May 2025']],
    problem: 'Two years in Bloomington between consulting and my current role.',
    built: ['Coursework in software engineering, visual analytics, applied machine learning and full-stack development'],
    big: '3.88', bigLabel: 'GPA out of 4.0', more: [], stack: [], with: '', skills: ['ai'],
  },
  {
    id: 'westfield', line: 'radcube', name: 'Westfield', tag: 'Civic data',
    title: 'Civic data for the City of Westfield',
    meta: [['Client', 'City of Westfield'], ['Role', 'Senior software engineer']],
    problem: 'Four departments manage dashboards internally, and residents see them on a public transparency portal. Staff spent days reading 20+ source files per department to answer questions, and Databricks had no way to stage a dashboard before the public sees it.',
    built: [
      'Embedded Databricks Genie in all 4 department dashboards, so staff ask questions in plain English',
      'Built the staging-to-production layer Databricks lacks, on Unity Catalog DEEP CLONE, so every monthly update is checked before it goes public',
      "Secured it with Azure AD SSO and set up Key Vault, Container Registry and Container Apps with the city's cloud team",
    ],
    big: '0', bigLabel: 'unverified updates published since launch',
    more: [['24', 'city staff using Genie'], ['Days → minutes', 'to answer a question']],
    stack: ['FastAPI', 'Databricks Genie', 'Unity Catalog', 'Azure'],
    with: "The city's DevOps, cloud and Azure AD teams, and Databricks engineers",
    skills: ['ai', 'python', 'cloud', 'data'],
  },
  {
    id: 'orbilens', line: 'radcube', name: 'Orbilens', tag: 'AskORBI',
    title: 'Orbilens and AskORBI',
    meta: [['Product', "Radcube's BI platform for Databricks, Power BI and Tableau"], ['Role', 'Senior software engineer']],
    problem: 'HR pulled numbers out of Excel by hand, 10–15 minutes per question, and paid for Power BI to build dashboards.',
    built: [
      'AskORBI: Amazon Bedrock picks the data source, writes Athena SQL over Glue-cataloged S3 data, and returns tables, charts and a written answer',
      'Answers pin to several dashboards at once, native or third-party',
      'Led 3 engineers to ship a drag-and-drop dashboard builder in 3 months, with 10+ chart types, maps and KPI cards',
    ],
    big: '5×', bigLabel: 'faster answers for HR (10–15 min → under 2)',
    more: [['6', 'Power BI licenses replaced'], ['10', 'HR staff using it']],
    stack: ['React', 'ECharts', 'Amazon Bedrock', 'Athena', 'AWS Glue', 'S3'],
    with: "A 3-engineer team I led, with Radcube's HR team as first users",
    skills: ['ai', 'react', 'cloud', 'data'],
  },
  {
    id: 'versante', line: 'radcube', name: 'Versante', tag: 'Care chatbot',
    title: 'Versante, AI care navigation',
    meta: [['Product', 'Healthcare AI chatbot'], ['Role', 'Frontend engineer']],
    problem: "Health seekers describe what they're going through to an AI chatbot, which guides them to the right health providers.",
    built: ['The React frontend, built from Figma: the AI chat, a screening page and an anonymous chat flow', 'QR codes that let a health seeker return to their conversation without an account'],
    big: '2', bigLabel: 'healthcare clients live on it', more: [], stack: ['React', 'Figma'], with: '', skills: ['ai', 'react'],
  },
]

export const RESULTS = [
  { stop: 'ava', value: 5, suffix: '×', label: 'faster chatbot workflows', where: 'Autodesk · a week → under a day' },
  { stop: 'sbsd', value: 75, suffix: '%', label: 'fewer clicks to apply', where: 'Virginia · 32+ → ~8' },
  { stop: 'tron', value: 80, suffix: '%', label: 'less manual coordination', where: 'Disney · access onboarding' },
  { stop: 'orbilens', value: 5, suffix: '×', label: 'faster answers from data', where: 'Radcube · 10–15 min → under 2' },
  { stop: 'orbilens', value: 6, suffix: '', label: 'Power BI licenses replaced', where: 'Radcube · dashboard builder' },
  { stop: 'westfield', value: 0, suffix: '', label: 'unverified public updates', where: 'City of Westfield · since launch' },
]

export const EMAIL = 'manishkumar.alagumalai@gmail.com'
export const LINKEDIN = 'https://www.linkedin.com/in/manish-chhetry/'
