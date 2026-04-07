export type Review = {
  courseCode: string;
  courseName: string;
  professorName?: string; // if set, this is a professor review
  text: string;
  tags: string[];
  stars: number;
};

export const REVIEWS: Review[] = [
  // ── CS 3500 ───────────────────────────────────────────────
  {
    courseCode: "CS 3500",
    courseName: "Object-Oriented Design",
    text: "The marble solitaire project broke my brain in the best way. Genuinely changed how I write code.",
    tags: ["project-heavy", "strict_deadlines"],
    stars: 5,
  },
  {
    courseCode: "CS 3500",
    courseName: "Object-Oriented Design",
    text: "Heavy workload but the SOLID principles you learn here will follow you every co-op.",
    tags: ["project-heavy", "exam-heavy"],
    stars: 4,
  },
  {
    courseCode: "CS 3500",
    courseName: "Object-Oriented Design",
    text: "Don't underestimate the assignments. Start early and go to office hours. Worth every hour.",
    tags: ["project-heavy", "attendance-required"],
    stars: 5,
  },
  {
    courseCode: "CS 3500",
    courseName: "Object-Oriented Design",
    text: "Design patterns clicked for me here. The freecell solver was painful but educational.",
    tags: ["project-heavy", "fast_paced"],
    stars: 4,
  },
  {
    courseCode: "CS 3500",
    courseName: "Object-Oriented Design",
    text: "Best CS course at NEU. Kaleidoscope assignment taught me more than any textbook could.",
    tags: ["project-heavy", "little_to_no_test"],
    stars: 5,
  },

  // ── CS 3000 ───────────────────────────────────────────────
  {
    courseCode: "CS 3000",
    courseName: "Algorithms & Data",
    text: "Harder than expected. The proofs require real mathematical maturity — don't skip the readings.",
    tags: ["exam-heavy", "fast_paced"],
    stars: 3,
  },
  {
    courseCode: "CS 3000",
    courseName: "Algorithms & Data",
    text: "Dynamic programming section is brutal but if you push through it, interviews feel easy.",
    tags: ["exam-heavy", "strict_deadlines"],
    stars: 4,
  },
  {
    courseCode: "CS 3000",
    courseName: "Algorithms & Data",
    text: "Midterm destroyed the curve. Come to every lecture, the exam is heavily theory-based.",
    tags: ["exam-heavy", "attendance-required"],
    stars: 3,
  },
  {
    courseCode: "CS 3000",
    courseName: "Algorithms & Data",
    text: "Problem sets are genuinely fun once you get the rhythm. Office hours are very active.",
    tags: ["project-heavy", "exam-heavy"],
    stars: 4,
  },
  {
    courseCode: "CS 3000",
    courseName: "Algorithms & Data",
    text: "Best prep for technical interviews. Graph algorithms section alone made this worth it.",
    tags: ["exam-heavy", "fast_paced"],
    stars: 5,
  },

  // ── CS 4500 ───────────────────────────────────────────────
  {
    courseCode: "CS 4500",
    courseName: "Software Development",
    text: "Real-world team project with an actual client. Communication skills matter as much as code.",
    tags: ["project-heavy", "group-work"],
    stars: 5,
  },
  {
    courseCode: "CS 4500",
    courseName: "Software Development",
    text: "Scrum, sprints, code reviews — it's a full simulation of industry work. Start the semester early.",
    tags: ["project-heavy", "group-work", "strict_deadlines"],
    stars: 4,
  },
  {
    courseCode: "CS 4500",
    courseName: "Software Development",
    text: "Group dynamics make or break this course. Ask for a good team assignment if you can.",
    tags: ["group-work", "flexible_deadlines"],
    stars: 3,
  },
  {
    courseCode: "CS 4500",
    courseName: "Software Development",
    text: "The final demo day is intense but exciting. One of the most memorable NEU experiences.",
    tags: ["project-heavy", "group-work"],
    stars: 5,
  },
  {
    courseCode: "CS 4500",
    courseName: "Software Development",
    text: "You'll learn Git, testing, and software architecture in ways lectures never could teach.",
    tags: ["project-heavy", "little_to_no_test"],
    stars: 4,
  },

  // ── CS 2500 ───────────────────────────────────────────────
  {
    courseCode: "CS 2500",
    courseName: "Fundamentals of CS 1",
    text: "The design recipe feels weird at first but by the end you'll use it instinctively. Trust the process.",
    tags: ["project-heavy", "slow_paced"],
    stars: 4,
  },
  {
    courseCode: "CS 2500",
    courseName: "Fundamentals of CS 1",
    text: "Don't let the 'intro' label fool you. This course is genuinely rigorous.",
    tags: ["exam-heavy", "fast_paced"],
    stars: 4,
  },
  {
    courseCode: "CS 2500",
    courseName: "Fundamentals of CS 1",
    text: "HtDP clicked for me in week 6. Patience is key. The TAs are incredibly helpful.",
    tags: ["project-heavy", "extra_credit"],
    stars: 5,
  },
  {
    courseCode: "CS 2500",
    courseName: "Fundamentals of CS 1",
    text: "If you're struggling, go to Piazza immediately. The community is very supportive.",
    tags: ["slow_paced", "flexible_deadlines"],
    stars: 3,
  },
  {
    courseCode: "CS 2500",
    courseName: "Fundamentals of CS 1",
    text: "Functional programming is not intuitive coming from Java or Python, but it rewires your brain.",
    tags: ["project-heavy", "exam-heavy"],
    stars: 4,
  },

  // ── CS 2510 ───────────────────────────────────────────────
  {
    courseCode: "CS 2510",
    courseName: "Fundamentals of CS 2",
    text: "OOP concepts that feel obvious in hindsight but take time to internalize. Lab sections are essential.",
    tags: ["project-heavy", "attendance-required"],
    stars: 4,
  },
  {
    courseCode: "CS 2510",
    courseName: "Fundamentals of CS 2",
    text: "The workload ramps hard in weeks 5–8. Don't fall behind on assignments.",
    tags: ["project-heavy", "strict_deadlines", "fast_paced"],
    stars: 3,
  },
  {
    courseCode: "CS 2510",
    courseName: "Fundamentals of CS 2",
    text: "Really solidifies your Java skills. The linked list implementation assignment is a great challenge.",
    tags: ["project-heavy", "exam-heavy"],
    stars: 4,
  },
  {
    courseCode: "CS 2510",
    courseName: "Fundamentals of CS 2",
    text: "Great bridge from functional to OO thinking. Come to office hours during the big project weeks.",
    tags: ["project-heavy", "flexible_deadlines"],
    stars: 4,
  },

  // ── CS 4400 ───────────────────────────────────────────────
  {
    courseCode: "CS 4400",
    courseName: "Programming Languages",
    text: "Mind-bending. By the end you'll implement your own interpreter. Absolutely transformative.",
    tags: ["project-heavy", "exam-heavy"],
    stars: 5,
  },
  {
    courseCode: "CS 4400",
    courseName: "Programming Languages",
    text: "Racket, Haskell, and type theory in one semester. Dense but incredibly rewarding.",
    tags: ["fast_paced", "exam-heavy"],
    stars: 4,
  },
  {
    courseCode: "CS 4400",
    courseName: "Programming Languages",
    text: "The lambda calculus section will break you. Read ahead and form a study group.",
    tags: ["exam-heavy", "group-work"],
    stars: 3,
  },
  {
    courseCode: "CS 4400",
    courseName: "Programming Languages",
    text: "Best course for understanding why languages are designed the way they are. A must for CS theory.",
    tags: ["exam-heavy", "little_to_no_test"],
    stars: 5,
  },

  // ── MATH 1341 ─────────────────────────────────────────────
  {
    courseCode: "MATH 1341",
    courseName: "Calculus 1",
    text: "Good foundation. The weekly quizzes keep you honest — don't try to cram for the midterm.",
    tags: ["exam-heavy", "attendance-required"],
    stars: 4,
  },
  {
    courseCode: "MATH 1341",
    courseName: "Calculus 1",
    text: "Professor explains limits brilliantly. WebAssign homework is manageable if you stay current.",
    tags: ["exam-heavy", "little_to_no_test"],
    stars: 4,
  },
  {
    courseCode: "MATH 1341",
    courseName: "Calculus 1",
    text: "Harder than high school calc but the exam style is very predictable. Practice old exams.",
    tags: ["exam-heavy", "slow_paced"],
    stars: 3,
  },
  {
    courseCode: "MATH 1341",
    courseName: "Calculus 1",
    text: "The integration techniques in the last third are where grades really separate. Start tutoring early.",
    tags: ["exam-heavy", "strict_deadlines"],
    stars: 3,
  },
  {
    courseCode: "MATH 1341",
    courseName: "Calculus 1",
    text: "If you're solid from AP Calc, this is manageable. Still worth attending every lecture though.",
    tags: ["exam-heavy", "attendance-required"],
    stars: 4,
  },

  // ── MATH 1342 ─────────────────────────────────────────────
  {
    courseCode: "MATH 1342",
    courseName: "Calculus 2",
    text: "Sequences and series are brutal. Every engineer I know says this was their hardest math class.",
    tags: ["exam-heavy", "fast_paced"],
    stars: 3,
  },
  {
    courseCode: "MATH 1342",
    courseName: "Calculus 2",
    text: "Power series section requires a lot of practice. The exam problems are creative and challenging.",
    tags: ["exam-heavy", "strict_deadlines"],
    stars: 4,
  },
  {
    courseCode: "MATH 1342",
    courseName: "Calculus 2",
    text: "Office hours are packed for a reason. Get there early, bring all your practice problems.",
    tags: ["exam-heavy", "attendance-required"],
    stars: 3,
  },
  {
    courseCode: "MATH 1342",
    courseName: "Calculus 2",
    text: "The Taylor series content is actually beautiful once it clicks. Just needs a lot of problems.",
    tags: ["exam-heavy", "little_to_no_test"],
    stars: 4,
  },

  // ── MATH 2321 ─────────────────────────────────────────────
  {
    courseCode: "MATH 2321",
    courseName: "Calculus 3",
    text: "3D visualization is everything in this class. Drawing the shapes on paper genuinely helps.",
    tags: ["exam-heavy", "fast_paced"],
    stars: 4,
  },
  {
    courseCode: "MATH 2321",
    courseName: "Calculus 3",
    text: "Stokes' theorem week is when the class gets hard. Study groups saved me here.",
    tags: ["exam-heavy", "group-work"],
    stars: 4,
  },
  {
    courseCode: "MATH 2321",
    courseName: "Calculus 3",
    text: "Genuinely enjoyable if you like geometry. The double/triple integrals feel like puzzles.",
    tags: ["exam-heavy", "slow_paced"],
    stars: 5,
  },
  {
    courseCode: "MATH 2321",
    courseName: "Calculus 3",
    text: "Important for physics and ML. Don't skip the Jacobian section — it shows up everywhere.",
    tags: ["exam-heavy", "strict_deadlines"],
    stars: 4,
  },
  {
    courseCode: "MATH 2321",
    courseName: "Calculus 3",
    text: "Parametric surfaces section is a beautiful way to close out the course. Strong finish.",
    tags: ["exam-heavy", "flexible_deadlines"],
    stars: 5,
  },

  // ── MATH 2331 ─────────────────────────────────────────────
  {
    courseCode: "MATH 2331",
    courseName: "Linear Algebra",
    text: "The most directly useful math for machine learning. Eigenvalues will follow you everywhere.",
    tags: ["exam-heavy", "fast_paced"],
    stars: 5,
  },
  {
    courseCode: "MATH 2331",
    courseName: "Linear Algebra",
    text: "Abstract? Yes. Worth it? Absolutely. The proofs teach you to think structurally.",
    tags: ["exam-heavy", "little_to_no_test"],
    stars: 4,
  },
  {
    courseCode: "MATH 2331",
    courseName: "Linear Algebra",
    text: "Orthogonality and SVD clicked for me late in the semester but unlocked so much.",
    tags: ["exam-heavy", "slow_paced"],
    stars: 4,
  },
  {
    courseCode: "MATH 2331",
    courseName: "Linear Algebra",
    text: "Take this before DS 4400. The first two weeks of ML will make complete sense.",
    tags: ["exam-heavy", "flexible_deadlines"],
    stars: 5,
  },
  {
    courseCode: "MATH 2331",
    courseName: "Linear Algebra",
    text: "Homework is challenging but very fair. Form a study group for the transformation proofs.",
    tags: ["exam-heavy", "group-work"],
    stars: 4,
  },

  // ── PHYS 1151 ─────────────────────────────────────────────
  {
    courseCode: "PHYS 1151",
    courseName: "Physics for Engineering 1",
    text: "Calculus-based mechanics from day one. Don't fall behind — the content builds fast.",
    tags: ["exam-heavy", "fast_paced"],
    stars: 3,
  },
  {
    courseCode: "PHYS 1151",
    courseName: "Physics for Engineering 1",
    text: "Labs are weekly and the reports take time. Budget 2-3 hours per lab outside of class.",
    tags: ["exam-heavy", "attendance-required"],
    stars: 4,
  },
  {
    courseCode: "PHYS 1151",
    courseName: "Physics for Engineering 1",
    text: "Rotational dynamics section is where most students lose points. Practice every problem type.",
    tags: ["exam-heavy", "strict_deadlines"],
    stars: 3,
  },
  {
    courseCode: "PHYS 1151",
    courseName: "Physics for Engineering 1",
    text: "The demos in lecture are genuinely great. Thermodynamics at the end is surprisingly intuitive.",
    tags: ["exam-heavy", "attendance-required"],
    stars: 4,
  },
  {
    courseCode: "PHYS 1151",
    courseName: "Physics for Engineering 1",
    text: "Solid foundation for EECE and MIE. The energy chapter is really satisfying once it clicks.",
    tags: ["exam-heavy", "slow_paced"],
    stars: 4,
  },

  // ── PHYS 1152 ─────────────────────────────────────────────
  {
    courseCode: "PHYS 1152",
    courseName: "Physics for Engineering 2",
    text: "Electrostatics is dense but beautifully structured. The field visualizations in class really help.",
    tags: ["exam-heavy", "attendance-required"],
    stars: 4,
  },
  {
    courseCode: "PHYS 1152",
    courseName: "Physics for Engineering 2",
    text: "Maxwell's equations at the end feel like magic. Hard week but so worth the payoff.",
    tags: ["exam-heavy", "fast_paced"],
    stars: 5,
  },
  {
    courseCode: "PHYS 1152",
    courseName: "Physics for Engineering 2",
    text: "Circuits section is harder than expected. Review Kirchhoff's laws before the midterm.",
    tags: ["exam-heavy", "strict_deadlines"],
    stars: 3,
  },
  {
    courseCode: "PHYS 1152",
    courseName: "Physics for Engineering 2",
    text: "Lab partners matter a lot here. The optics experiments are actually really fun.",
    tags: ["group-work", "attendance-required"],
    stars: 4,
  },
  {
    courseCode: "PHYS 1152",
    courseName: "Physics for Engineering 2",
    text: "More conceptual than PHYS 1151. If you understand the why, the problems become manageable.",
    tags: ["exam-heavy", "slow_paced"],
    stars: 4,
  },

  // ── ECON 1115 ─────────────────────────────────────────────
  {
    courseCode: "ECON 1115",
    courseName: "Principles of Microeconomics",
    text: "A great general education course. The supply and demand models are surprisingly elegant.",
    tags: ["exam-heavy", "slow_paced"],
    stars: 4,
  },
  {
    courseCode: "ECON 1115",
    courseName: "Principles of Microeconomics",
    text: "Game theory section in week 10 is fascinating. Really changes how you see decision-making.",
    tags: ["exam-heavy", "little_to_no_test"],
    stars: 5,
  },
  {
    courseCode: "ECON 1115",
    courseName: "Principles of Microeconomics",
    text: "Easier than expected if you take good notes. The graphs make more sense after a second pass.",
    tags: ["exam-heavy", "flexible_deadlines"],
    stars: 3,
  },
  {
    courseCode: "ECON 1115",
    courseName: "Principles of Microeconomics",
    text: "Producer surplus and consumer surplus feel abstract at first but become second nature fast.",
    tags: ["exam-heavy", "attendance-required"],
    stars: 4,
  },
  {
    courseCode: "ECON 1115",
    courseName: "Principles of Microeconomics",
    text: "Take this before ECON 1116. The micro intuition makes macro much easier to follow.",
    tags: ["exam-heavy", "slow_paced"],
    stars: 5,
  },

  // ── ECON 1116 ─────────────────────────────────────────────
  {
    courseCode: "ECON 1116",
    courseName: "Principles of Macroeconomics",
    text: "GDP, inflation, and monetary policy — very relevant to what's happening in the real world.",
    tags: ["exam-heavy", "slow_paced"],
    stars: 4,
  },
  {
    courseCode: "ECON 1116",
    courseName: "Principles of Macroeconomics",
    text: "The IS-LM model takes a few passes to understand. Diagrams are essential — draw them out.",
    tags: ["exam-heavy", "flexible_deadlines"],
    stars: 3,
  },
  {
    courseCode: "ECON 1116",
    courseName: "Principles of Macroeconomics",
    text: "Surprisingly interesting once the global economy section hits. Policy debates are engaging.",
    tags: ["exam-heavy", "attendance-required"],
    stars: 4,
  },
  {
    courseCode: "ECON 1116",
    courseName: "Principles of Macroeconomics",
    text: "Weekly recitations are optional but very useful for the exams. Don't skip them.",
    tags: ["exam-heavy", "extra_credit"],
    stars: 4,
  },

  // ── DS 2000 ───────────────────────────────────────────────
  {
    courseCode: "DS 2000",
    courseName: "Programming with Data",
    text: "Great intro to Python for data. The final project using real datasets is really motivating.",
    tags: ["project-heavy", "flexible_deadlines"],
    stars: 5,
  },
  {
    courseCode: "DS 2000",
    courseName: "Programming with Data",
    text: "Pandas and matplotlib feel clunky at first but become powerful fast. Stick with it.",
    tags: ["project-heavy", "slow_paced"],
    stars: 4,
  },
  {
    courseCode: "DS 2000",
    courseName: "Programming with Data",
    text: "Really accessible if you have no programming background. The TAs are patient and helpful.",
    tags: ["slow_paced", "flexible_deadlines"],
    stars: 4,
  },
  {
    courseCode: "DS 2000",
    courseName: "Programming with Data",
    text: "You'll spend a lot of time cleaning messy real-world data. Essential skill for any DS path.",
    tags: ["project-heavy", "little_to_no_test"],
    stars: 5,
  },

  // ── DS 3000 ───────────────────────────────────────────────
  {
    courseCode: "DS 3000",
    courseName: "Foundations of Data Science",
    text: "Stats and ML combined — the ideal second DS course. Regression section is thorough.",
    tags: ["exam-heavy", "project-heavy"],
    stars: 5,
  },
  {
    courseCode: "DS 3000",
    courseName: "Foundations of Data Science",
    text: "Cross-validation and overfitting section finally made these concepts concrete for me.",
    tags: ["project-heavy", "exam-heavy"],
    stars: 4,
  },
  {
    courseCode: "DS 3000",
    courseName: "Foundations of Data Science",
    text: "Heavy on NumPy/scikit-learn. Make sure your Python is solid going in or it'll be rough.",
    tags: ["project-heavy", "fast_paced"],
    stars: 3,
  },
  {
    courseCode: "DS 3000",
    courseName: "Foundations of Data Science",
    text: "The Kaggle-style final project is super engaging. Best capstone assignment I've done here.",
    tags: ["project-heavy", "flexible_deadlines"],
    stars: 5,
  },

  // ── ENGL 1111 ─────────────────────────────────────────────
  {
    courseCode: "ENGL 1111",
    courseName: "First-Year Writing",
    text: "Workshop format forces you to actually engage with feedback. Uncomfortable but useful.",
    tags: ["project-heavy", "group-work"],
    stars: 4,
  },
  {
    courseCode: "ENGL 1111",
    courseName: "First-Year Writing",
    text: "The research paper at the end is actually a great experience if you pick a topic you care about.",
    tags: ["project-heavy", "flexible_deadlines"],
    stars: 4,
  },
  {
    courseCode: "ENGL 1111",
    courseName: "First-Year Writing",
    text: "Comes down to your section instructor. Some are excellent, others less engaging.",
    tags: ["project-heavy", "attendance-required"],
    stars: 3,
  },
  {
    courseCode: "ENGL 1111",
    courseName: "First-Year Writing",
    text: "More useful than I expected. Thesis structuring skills showed up immediately in other courses.",
    tags: ["project-heavy", "slow_paced"],
    stars: 4,
  },

  // ── MGMT 1000 ─────────────────────────────────────────────
  {
    courseCode: "MGMT 1000",
    courseName: "Management & Org. Analysis",
    text: "Good intro to org behavior. Case studies are interesting and the midterm is very straightforward.",
    tags: ["exam-heavy", "group-work"],
    stars: 4,
  },
  {
    courseCode: "MGMT 1000",
    courseName: "Management & Org. Analysis",
    text: "Easy GPA boost for STEM students. The group project does require some coordination effort.",
    tags: ["group-work", "flexible_deadlines"],
    stars: 3,
  },
  {
    courseCode: "MGMT 1000",
    courseName: "Management & Org. Analysis",
    text: "Leadership frameworks from here actually came up in co-op interviews. Useful breadth.",
    tags: ["exam-heavy", "little_to_no_test"],
    stars: 4,
  },
  {
    courseCode: "MGMT 1000",
    courseName: "Management & Org. Analysis",
    text: "Surprisingly enjoyable. The organizational culture readings spark good class discussions.",
    tags: ["flexible_deadlines", "slow_paced"],
    stars: 4,
  },

  // ── ENGW 3302 ─────────────────────────────────────────────
  {
    courseCode: "ENGW 3302",
    courseName: "Advanced Technical Writing",
    text: "Made my co-op resume and cover letters dramatically better. Take this before recruiting season.",
    tags: ["project-heavy", "flexible_deadlines"],
    stars: 5,
  },
  {
    courseCode: "ENGW 3302",
    courseName: "Advanced Technical Writing",
    text: "The technical report assignment is realistic and forces you to write for non-expert audiences.",
    tags: ["project-heavy", "strict_deadlines"],
    stars: 4,
  },
  {
    courseCode: "ENGW 3302",
    courseName: "Advanced Technical Writing",
    text: "Peer review cycles are genuinely helpful. You'll get concrete line-by-line feedback.",
    tags: ["group-work", "project-heavy"],
    stars: 4,
  },
  {
    courseCode: "ENGW 3302",
    courseName: "Advanced Technical Writing",
    text: "Often overlooked but one of the highest ROI courses in the engineering curriculum.",
    tags: ["project-heavy", "little_to_no_test"],
    stars: 5,
  },

  // ── CS 4810 ───────────────────────────────────────────────
  {
    courseCode: "CS 4810",
    courseName: "Computer Graphics",
    text: "Ray tracer from scratch in C++. Watching your first correctly lit render is genuinely euphoric.",
    tags: ["project-heavy", "strict_deadlines"],
    stars: 5,
  },
  {
    courseCode: "CS 4810",
    courseName: "Computer Graphics",
    text: "OpenGL pipeline, shaders, and lighting models all in one semester. Dense and exciting.",
    tags: ["project-heavy", "fast_paced"],
    stars: 4,
  },
  {
    courseCode: "CS 4810",
    courseName: "Computer Graphics",
    text: "Takes real mathematical maturity. Linear algebra and calculus are applied constantly.",
    tags: ["project-heavy", "exam-heavy"],
    stars: 4,
  },

  // ── Bonus ─────────────────────────────────────────────────
  {
    courseCode: "EECE 2160",
    courseName: "Embedded Design",
    text: "FPGA programming in VHDL on a real board. Bring coffee to the lab. It's worth it.",
    tags: ["project-heavy", "attendance-required"],
    stars: 4,
  },
  {
    courseCode: "EECE 2160",
    courseName: "Embedded Design",
    text: "Bridging hardware and software in real time. Nothing else at NEU feels quite like this.",
    tags: ["project-heavy", "fast_paced"],
    stars: 5,
  },
  {
    courseCode: "CS 3200",
    courseName: "Database Design",
    text: "SQL and relational modeling done right. The final project building a full schema is excellent.",
    tags: ["project-heavy", "little_to_no_test"],
    stars: 5,
  },
  {
    courseCode: "CS 3200",
    courseName: "Database Design",
    text: "Normalization theory is dense but the practical SQL skills are immediately co-op-applicable.",
    tags: ["project-heavy", "flexible_deadlines"],
    stars: 4,
  },
  {
    courseCode: "IS 4900",
    courseName: "Professional Development",
    text: "Small cohort makes this feel personal. Co-op prep content is actually used in real interviews.",
    tags: ["group-work", "flexible_deadlines"],
    stars: 5,
  },
  {
    courseCode: "ARTG 2260",
    courseName: "UX Research Methods",
    text: "User interviews and prototyping in one course. Great complement to any CS or DS degree.",
    tags: ["project-heavy", "group-work"],
    stars: 5,
  },
  {
    courseCode: "CHEM 1161",
    courseName: "General Chemistry 1",
    text: "Stoichiometry to equilibrium in 16 weeks. Pre-reading each lecture is non-negotiable.",
    tags: ["exam-heavy", "strict_deadlines"],
    stars: 3,
  },

  // ── Professor reviews ─────────────────────────────────────
  {
    courseCode: "CS 3500",
    courseName: "Object-Oriented Design",
    professorName: "Lerner",
    text: "Genuinely one of the best teachers I've had. Explains design patterns like they're obvious in hindsight.",
    tags: ["project-heavy", "attendance-required"],
    stars: 5,
  },
  {
    courseCode: "CS 3000",
    courseName: "Algorithms & Data",
    professorName: "Razzaq",
    text: "Very clear lectures. Makes proof-writing feel approachable. Goes out of their way to help during office hours.",
    tags: ["exam-heavy", "attendance-required"],
    stars: 5,
  },
  {
    courseCode: "MATH 2331",
    courseName: "Linear Algebra",
    professorName: "Breen",
    text: "Patient, thorough, and actually makes eigenvalues interesting. Take this section if you can.",
    tags: ["exam-heavy", "slow_paced"],
    stars: 5,
  },
  {
    courseCode: "CS 4500",
    courseName: "Software Development",
    professorName: "Findler",
    text: "Demanding but fair. You leave this course a significantly better software engineer.",
    tags: ["project-heavy", "group-work", "strict_deadlines"],
    stars: 4,
  },
  {
    courseCode: "DS 3000",
    courseName: "Foundations of Data Science",
    professorName: "Zheng",
    text: "Super engaging. Real-world datasets every week and always willing to explain the intuition.",
    tags: ["project-heavy", "fast_paced"],
    stars: 5,
  },
  {
    courseCode: "PHYS 1151",
    courseName: "Physics for Engineering 1",
    professorName: "Gauthier",
    text: "Tough course, but they break down every concept clearly. Attendance really matters here.",
    tags: ["exam-heavy", "attendance-required"],
    stars: 4,
  },
  {
    courseCode: "ECON 1115",
    courseName: "Principles of Microeconomics",
    professorName: "Velarde",
    text: "Makes econ approachable even if you've never touched it. Lots of real examples from current events.",
    tags: ["exam-heavy", "slow_paced"],
    stars: 4,
  },
  {
    courseCode: "CS 4400",
    courseName: "Programming Languages",
    professorName: "Krishnamurthi",
    text: "Mind-expanding. You'll never look at code the same way. Prepare to think hard.",
    tags: ["exam-heavy", "fast_paced", "little_to_no_test"],
    stars: 5,
  },
];
