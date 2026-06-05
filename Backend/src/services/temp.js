const resume = `
Abhishek Sharma
Phone: +91 9876543210
Email: [abhisheksharma.dev@gmail.com](mailto:abhisheksharma.dev@gmail.com)
LinkedIn: linkedin.com/in/abhisheksharma
GitHub: github.com/abhisheksharma
Location: Meerut, Uttar Pradesh

Professional Summary
Passionate MERN Stack Developer with hands-on experience building full-stack web applications using MongoDB, Express.js, React.js, and Node.js. Skilled in creating REST APIs, authentication systems, database management, and responsive user interfaces. Interested in developing scalable applications and exploring Generative AI technologies.

Technical Skills
Frontend: React.js, JavaScript, HTML, CSS, Tailwind CSS, React Router, Axios
Backend: Node.js, Express.js, REST APIs, JWT Authentication
Database: MongoDB, Mongoose
Tools & Technologies: Git, GitHub, Postman, VS Code
Concepts: MVC Architecture, Authentication, CRUD Operations, API Integration, Responsive Design

Projects

en AI Resume Analyzer Platform

Developed a full-stack Generative AI platform for resume analysis and job description matching
Implemented JWT authentication with protected routes and token blacklisting
Built resume upload functionality with ATS optimization features
Integrated AI-powered interview question generation and skill-gap analysis
Tech Stack: React.js, Node.js, Express.js, MongoDB

MERN Authentication System

* Created complete authentication flow including login, registration, logout, and protected routes
* Implemented reusable authentication hooks and middleware architecture
* Built secure API communication between frontend and backend
* Tech Stack: React.js, Node.js, Express.js, MongoDB

Task Management Application

* Built a CRUD-based task management system with user authentication
* Implemented responsive UI and backend API architecture
* Developed database relationships and state management features
* Tech Stack: React.js, Express.js, MongoDB, Node.js

Education

Bachelor of Technology (Computer Science)

ABC Institute of Technology

2021 – 2025

Certifications

* MERN Stack Development
* JavaScript Fundamentals
* Backend Development with Node.js

Strengths

* Problem Solving
* Team Collaboration
* Quick Learner
* Clean Code Practices
* Strong Debugging Skills
`


const selfDescription = `
I am a passionate MERN Stack Developer with a strong interest in building scalable and user-friendly web applications. I enjoy working 
across both frontend and backend technologies, using MongoDB, Express.js, React.js, and Node.js to create complete solutions. 
I am always curious about new technologies and continuously work on improving my development skills.

I have experience developing full-stack projects involving authentication systems, REST APIs, database management, and responsive
user interfaces. Along with web development, I am also interested in Generative AI and enjoy building projects that solve real-world 
problems through technology and automation.

Apart from technical skills, I consider myself a quick learner, problem solver, and team player who enjoys challenges and continuous 
learning. I am motivated to build impactful applications, improve my skills through hands-on projects, and contribute effectively in 
collaborative development environments.
`


const jobDescription = `
Role: NodeJS Backend Developer

Location: India/Remote

Type: Contract

Job Description:

What You'll Do
• Build and maintain Node.js backend services: REST APIs, SQS consumers, and ECS Fargate worker processes
• Develop workers handling using patterns for parallel execution
• Integrate with AWS Bedrock (Claude Sonnet) for AI-assisted QC checks
• Build backend services: job submission UI, real-time status tracking, results dashboards
• Experience with Playwright + axe-core automated tests

What You Bring
• 5+ years in Node.js backend development; solid understanding of async patterns, queue-based architectures, and REST API design
• Familiarity with PostgreSQL and Redis (caching, session, pub-sub patterns)
• Pharma/healthcare domain knowledge (Veeva, MLR, WCAG compliance) is a strong advantage
• Experience with AWS (S3, SQS, ECS, Bedrock) is a strong advantage
`


module.exports = { resume, selfDescription, jobDescription }