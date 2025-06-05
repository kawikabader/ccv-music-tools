#!/usr/bin/env node

/**
 * Performance monitoring script for post-deployment checks
 * Runs basic performance and accessibility audits
 */

const https = require('https');
const fs = require('fs');

const SITE_URL = process.env.SITE_URL || 'https://kawikabader.github.io/team-roster/';
const TIMEOUT = 10000; // 10 seconds

console.log('🚀 Starting performance check for:', SITE_URL);

/**
 * Check site availability and response time
 */
async function checkSiteAvailability() {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const req = https.get(SITE_URL, res => {
      const responseTime = Date.now() - startTime;

      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          responseTime,
          contentLength: data.length,
          headers: res.headers,
        });
      });
    });

    req.on('error', reject);
    req.setTimeout(TIMEOUT, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

/**
 * Check for common performance issues
 */
function analyzePerformance(response) {
  const issues = [];
  const recommendations = [];

  // Check response time
  if (response.responseTime > 3000) {
    issues.push(`Slow response time: ${response.responseTime}ms`);
    recommendations.push('Consider optimizing server response time or using a CDN');
  } else if (response.responseTime > 1000) {
    recommendations.push(
      'Response time could be improved (currently ' + response.responseTime + 'ms)'
    );
  }

  // Check caching headers
  if (!response.headers['cache-control']) {
    issues.push('Missing cache-control header');
    recommendations.push('Add proper caching headers for better performance');
  }

  // Check compression
  if (!response.headers['content-encoding']) {
    recommendations.push('Consider enabling gzip/brotli compression');
  }

  // Check security headers
  const securityHeaders = ['x-content-type-options', 'x-frame-options', 'x-xss-protection'];

  securityHeaders.forEach(header => {
    if (!response.headers[header]) {
      recommendations.push(`Consider adding ${header} security header`);
    }
  });

  return { issues, recommendations };
}

/**
 * Generate performance report
 */
function generateReport(response, analysis) {
  const report = {
    timestamp: new Date().toISOString(),
    url: SITE_URL,
    status: response.statusCode === 200 ? 'PASS' : 'FAIL',
    metrics: {
      statusCode: response.statusCode,
      responseTime: response.responseTime,
      contentLength: response.contentLength,
    },
    issues: analysis.issues,
    recommendations: analysis.recommendations,
  };

  // Write report to file
  fs.writeFileSync('performance-report.json', JSON.stringify(report, null, 2));

  return report;
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log('📊 Checking site availability...');
    const response = await checkSiteAvailability();

    console.log(`✅ Site is available (${response.statusCode})`);
    console.log(`⏱️  Response time: ${response.responseTime}ms`);
    console.log(`📦 Content length: ${response.contentLength} bytes`);

    console.log('\n🔍 Analyzing performance...');
    const analysis = analyzePerformance(response);

    const report = generateReport(response, analysis);

    // Print summary
    console.log('\n📋 Performance Summary:');
    console.log(`Status: ${report.status}`);
    console.log(`Response Time: ${report.metrics.responseTime}ms`);

    if (analysis.issues.length > 0) {
      console.log('\n⚠️  Issues found:');
      analysis.issues.forEach(issue => console.log(`  - ${issue}`));
    }

    if (analysis.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      analysis.recommendations.forEach(rec => console.log(`  - ${rec}`));
    }

    console.log('\n📄 Full report saved to: performance-report.json');

    // Exit with error if critical issues found
    if (response.statusCode !== 200 || response.responseTime > 5000) {
      console.log('\n❌ Critical performance issues detected');
      process.exit(1);
    }

    console.log('\n✅ Performance check completed successfully');
  } catch (error) {
    console.error('\n❌ Performance check failed:', error.message);
    process.exit(1);
  }
}

main();
