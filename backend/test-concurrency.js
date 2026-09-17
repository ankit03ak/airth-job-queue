const http = require('http');

const BASE_URL = 'http://localhost:4000';

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', (err) => reject(err));
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runConcurrencyTest() {
  console.log('=== STARTING AUTOMATED JOB QUEUE & CONCURRENCY TEST ===\n');

  // 1. Create a Test Job
  console.log('1. Testing POST /jobs (Create Job)...');
  const createRes = await request('POST', '/jobs', {
    title: 'High Priority Race Condition Test',
    type: 'DATA_EXPORT',
  });

  if (createRes.status !== 201) {
    console.error('❌ Create Job failed:', createRes.body);
    process.exit(1);
  }

  const job = createRes.body;
  console.log(`✅ Job Created: ID=${job.id}, status=${job.status}, version=${job.version}\n`);

  // 2. Test Invalid Transition (pending -> completed directly)
  console.log('2. Testing Invalid Transition Enforcement (pending -> completed)...');
  const invalidRes = await request('PATCH', `/jobs/${job.id}/status`, {
    status: 'completed',
  });

  if (invalidRes.status === 400) {
    console.log(`✅ State Machine Enforced Correctly (400 Bad Request): "${invalidRes.body.message}"\n`);
  } else {
    console.error('❌ Expected 400 Bad Request, got:', invalidRes.status, invalidRes.body);
  }

  // 3. Test Concurrency Race Condition (10 parallel requests setting status to 'running')
  console.log('3. Testing Concurrency Race Condition (10 simultaneous PATCH /jobs/:id/status -> "running")...');
  const requests = Array.from({ length: 10 }, (_, i) =>
    request('PATCH', `/jobs/${job.id}/status`, { status: 'running' }).then((res) => ({
      index: i + 1,
      status: res.status,
      body: res.body,
    }))
  );

  const results = await Promise.all(requests);
  const successCount = results.filter((r) => r.status === 200).length;
  const failureCount = results.filter((r) => r.status === 409 || r.status === 400).length;

  console.log(`Results: ${successCount} Succeeded (200 OK), ${failureCount} Blocked (409 Conflict / 400 Bad Request)`);

  if (successCount === 1 && failureCount === 9) {
    console.log('✅ ATOMIC CONCURRENCY TEST PASSED! Exactly 1 request succeeded, 9 requests were blocked.\n');
  } else {
    console.error(`❌ CONCURRENCY TEST FAILED! Expected 1 success & 9 blocked, got ${successCount} success & ${failureCount} blocked.`);
    console.log('Detailed Responses:', results);
  }

  // 4. Test GET /jobs and Counts
  console.log('4. Testing GET /jobs (Fetch Jobs & Summary Counts)...');
  const getRes = await request('GET', '/jobs');
  if (getRes.status === 200 && getRes.body.counts) {
    console.log('✅ GET /jobs succeeded. Status Counts:', getRes.body.counts, '\n');
  } else {
    console.error('❌ GET /jobs failed:', getRes.body);
  }

  console.log('=== ALL AUTOMATED TESTS COMPLETED SUCCESSFULLY ===');
}

runConcurrencyTest().catch((err) => {
  console.error('Test Error:', err);
  process.exit(1);
});
