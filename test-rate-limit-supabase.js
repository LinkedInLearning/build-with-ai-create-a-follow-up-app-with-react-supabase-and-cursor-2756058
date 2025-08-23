// Test script using Supabase client approach
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://qpptyplmauiytdehczwq.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwcHR5cGxtYXVpeXRkZWhjendxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NTc3NzAsImV4cCI6MjA3MTEzMzc3MH0.O8zCD2lf9hIA8pQR_1NFPGlDT5DxWgOl2hojMBuSk-0";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

    const { data, error } = await supabase.functions.invoke(
      "rate-limited-form-submit",
      {
        body: testData,
      }
    );

    if (error) {
      console.log("❌ Function call failed:", error);
    } else {
      console.log("✅ Function call successful:", data);
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
