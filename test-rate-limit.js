// Test script for rate-limited form submission
const FUNCTION_URL =
  "https://qpptyplmauiytdehczwq.supabase.co/functions/v1/rate-limited-form-submit";

// Use the actual anon key from your Supabase project
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwcHR5cGxtYXVpeXRkZWhjendxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NTc3NzAsImV4cCI6MjA3MTEzMzc3MH0.O8zCD2lf9hIA8pQR_1NFPGlDT5DxWgOl2hojMBuSk-0";

const testData = {
  name: "Test User",
  email: "test@example.com",
  source: "Google",
  interest: "Testing rate limiting",
  consent_marketing: true,
  consent_privacy: true,
};

async function testFunction() {
  try {
    console.log("Testing function with data:", testData);

    const response = await fetch(FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(testData),
    });

    const result = await response.json();

    console.log("Response status:", response.status);
    console.log(
      "Response headers:",
      Object.fromEntries(response.headers.entries())
    );
    console.log("Response body:", result);

    if (response.ok) {
      console.log("✅ Function call successful");
    } else {
      console.log("❌ Function call failed");
    }
  } catch (error) {
    console.error("❌ Error testing function:", error);
  }
}

// Test rate limiting by making multiple calls
async function testRateLimiting() {
  console.log("\n🧪 Testing Rate Limiting...");

  for (let i = 1; i <= 6; i++) {
    console.log(`\n--- Test ${i}/6 ---`);
    await testFunction();

    // Wait 1 second between calls
    if (i < 6) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}

// Run tests
console.log("🚀 Starting Rate Limit Function Tests...\n");
testRateLimiting();
