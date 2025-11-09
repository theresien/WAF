#!/usr/bin/env node

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

async function checkBackend() {
  console.log(`Checking backend connectivity at: ${API_URL}`);
  
  try {
    const response = await fetch(`${API_URL}/devices?page=0&size=1`);
    
    if (response.ok) {
      console.log("✅ Backend is running and accessible");
      const data = await response.json();
      console.log(`📊 Found ${data.totalElements || 0} devices in database`);
    } else {
      console.log(`❌ Backend responded with error: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.log(`❌ Cannot connect to backend: ${error.message}`);
    console.log("\n🔧 Troubleshooting steps:");
    console.log("1. Make sure your backend server is running on port 8080");
    console.log("2. Check if the backend URL is correct in .env.local");
    console.log("3. Verify CORS settings allow requests from your frontend");
  }
}

checkBackend();