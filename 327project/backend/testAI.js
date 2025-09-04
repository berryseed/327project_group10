const aiService = require("./services/aiService");

(async () => {
  try {
    console.log("🚀 Running AIService comprehensive test...\n");

    // Test 1: Task Analysis
    console.log("📋 Test 1: Task Analysis");
    console.log("=" .repeat(50));
    const sampleTask = {
      title: "Write project report",
      description: "Prepare the final report for the software project including documentation and presentation",
      priority: "medium",
      deadline: "2025-09-10"
    };

    const analysisResult = await aiService.analyzeTask(sampleTask);
    console.log("✅ Task Analysis Result:");
    console.dir(analysisResult, { depth: null, colors: true });
    console.log("\n");

    // Test 2: Task Suggestions
    console.log("💡 Test 2: Task Suggestions");
    console.log("=" .repeat(50));
    const existingTasks = [
      { title: "Research phase", description: "Gather requirements and analyze competitors" },
      { title: "Design phase", description: "Create wireframes and user interface mockups" }
    ];
    const userInput = "I need to complete a web development project";

    const suggestionsResult = await aiService.generateTaskSuggestions(existingTasks, userInput);
    console.log("✅ Task Suggestions Result:");
    console.dir(suggestionsResult, { depth: null, colors: true });
    console.log("\n");

    // Test 3: Schedule Recommendations
    console.log("📅 Test 3: Schedule Recommendations");
    console.log("=" .repeat(50));
    const tasks = [
      { title: "Frontend Development", priority: "high", deadline: "2025-09-15" },
      { title: "Backend API", priority: "high", deadline: "2025-09-12" },
      { title: "Testing", priority: "medium", deadline: "2025-09-18" },
      { title: "Documentation", priority: "low", deadline: "2025-09-20" }
    ];
    const userPreferences = { workHours: "9-17", breakDuration: 15 };

    const scheduleResult = await aiService.getScheduleRecommendations(tasks, userPreferences);
    console.log("✅ Schedule Recommendations Result:");
    console.dir(scheduleResult, { depth: null, colors: true });
    console.log("\n");

    // Test 4: Workload Analysis
    console.log("⚖️ Test 4: Workload Analysis");
    console.log("=" .repeat(50));
    const userProductivity = { avgTaskTime: 2, focusLevel: "high", availableHours: 8 };

    const workloadResult = await aiService.analyzeWorkload(tasks, userProductivity);
    console.log("✅ Workload Analysis Result:");
    console.dir(workloadResult, { depth: null, colors: true });
    console.log("\n");

    // Test 5: Full Schedule Planning
    console.log("🎯 Test 5: Full Schedule Planning");
    console.log("=" .repeat(50));
    const userDescription = "I'm a computer science student working on a final project for my software engineering course";
    const preferences = { studyTime: "evenings", preferredDays: ["monday", "wednesday", "friday"] };
    const constraints = { maxHoursPerDay: 4, deadline: "2025-09-25" };

    const fullScheduleResult = await aiService.planFullSchedule(userDescription, preferences, constraints);
    console.log("✅ Full Schedule Planning Result:");
    console.dir(fullScheduleResult, { depth: null, colors: true });

    console.log("\n🎉 All tests completed successfully!");
    console.log("Note: If you see 'fallback' responses, it means no AI API keys are configured.");
    console.log("To get real AI responses, add your API keys to a .env file.");

  } catch (err) {
    console.error("❌ Test failed:", err);
  }
})();
