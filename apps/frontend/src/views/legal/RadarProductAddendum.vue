<template>
  <div class="legal-content">
    <section>
      <h2>Obsrvr Radar – Product Addendum</h2>
      <p class="text-muted">Version 1.0 | Effective: December 29, 2025</p>

      <div class="alert alert-info mt-3">
        <strong>Note:</strong> This Product Addendum supplements the Obsrvr Master
        Terms of Service. In case of conflict, the Master Terms control unless
        explicitly stated otherwise below.
      </div>
    </section>

    <section>
      <h3>1. Service Description</h3>
      <p>
        Obsrvr Radar ("Radar") is a monitoring and analytics platform for the
        Stellar blockchain network. Radar provides:
      </p>
      <ul>
        <li>Real-time visualization of network topology and validator status</li>
        <li>Historical performance data and analytics for nodes and organizations</li>
        <li>Network health metrics and trend analysis</li>
        <li>Optional email notification services for network events</li>
        <li>Public API access to network data and metrics</li>
      </ul>
      <p>
        <strong>Important:</strong> Radar is an <em>observability and decision-support tool</em>,
        not an operational control system or authoritative data source.
      </p>
    </section>

    <section>
      <h3>2. Observability-Only Nature</h3>

      <h4>2.1 No Operational Reliance</h4>
      <p>
        Radar is designed to provide visibility into Stellar network behavior for
        informational and analytical purposes. You acknowledge and agree that:
      </p>
      <ul>
        <li>
          <strong>Radar does not control, manage, or operate validators or network infrastructure.</strong>
          You remain solely responsible for your validator operations.
        </li>
        <li>
          <strong>Radar data is observational, not authoritative.</strong>
          The canonical source of truth for blockchain state is the Stellar network itself.
        </li>
        <li>
          <strong>Critical operational decisions must not rely solely on Radar.</strong>
          Always verify critical information through multiple independent sources.
        </li>
        <li>
          <strong>Radar cannot prevent network failures or validator issues.</strong>
          Monitoring tools observe problems; they do not fix them.
        </li>
      </ul>

      <h4>2.2 No Liability for Validator Operations</h4>
      <p>
        Obsrvr is not responsible for:
      </p>
      <ul>
        <li>Validator downtime, slashing, or loss of rewards</li>
        <li>Network consensus failures or forks</li>
        <li>Quorum configuration errors or trust graph issues</li>
        <li>Validator operational costs or infrastructure failures</li>
        <li>Decisions made based on Radar data or alerts</li>
      </ul>
      <p>
        You acknowledge that operating a Stellar validator carries inherent risks
        and that Radar monitoring does not mitigate those risks.
      </p>
    </section>

    <section>
      <h3>3. Data Accuracy and Limitations</h3>

      <h4>3.1 Best-Effort Data Collection</h4>
      <p>
        Radar collects data from the Stellar network on a best-effort basis. We do
        not guarantee:
      </p>
      <ul>
        <li><strong>Accuracy:</strong> Metrics may be incorrect due to network conditions, crawling issues, or data processing errors</li>
        <li><strong>Completeness:</strong> Some nodes, organizations, or events may not be detected or may be missing from historical data</li>
        <li><strong>Timeliness:</strong> Network crawls occur periodically (typically every few minutes); real-time state may differ from displayed state</li>
        <li><strong>Consistency:</strong> Metrics may vary between measurement periods or differ from other monitoring tools</li>
      </ul>

      <h4>3.2 Known Limitations</h4>
      <p>Users should be aware of the following limitations:</p>
      <ul>
        <li>
          <strong>Crawl Latency:</strong> Displayed data reflects the most recent
          network crawl, not instantaneous network state
        </li>
        <li>
          <strong>Partial Visibility:</strong> Private or firewalled nodes may not
          be discovered or may appear offline
        </li>
        <li>
          <strong>Quorum Analysis:</strong> Quorum set analysis is based on
          advertised configurations and may not reflect actual consensus behavior
        </li>
        <li>
          <strong>Historical Gaps:</strong> Historical data may contain gaps due to
          crawling failures, maintenance windows, or data retention policies
        </li>
      </ul>

      <h4>3.3 Data Sources</h4>
      <p>
        Radar derives data from:
      </p>
      <ul>
        <li>Direct peer-to-peer connections with Stellar validators</li>
        <li>Public Stellar Horizon API servers</li>
        <li>Validator home domain TOML files</li>
        <li>Community-maintained validator lists and metadata</li>
      </ul>
      <p>
        We are not responsible for inaccuracies in third-party data sources.
      </p>
    </section>

    <section>
      <h3>4. Service Availability</h3>

      <h4>4.1 No Uptime Guarantees</h4>
      <p>
        Unless you have a separate Service Level Agreement (SLA) with Obsrvr, Radar
        is provided without any uptime or availability guarantees. The service may
        experience:
      </p>
      <ul>
        <li>Scheduled maintenance windows (typically announced in advance)</li>
        <li>Unscheduled outages due to infrastructure failures</li>
        <li>Performance degradation during high load periods</li>
        <li>Feature changes or deprecations</li>
      </ul>

      <h4>4.2 Crawling and Monitoring Continuity</h4>
      <p>
        Network crawling and data collection occur on a periodic basis but are not
        guaranteed to be continuous or uninterrupted. Extended service outages may
        result in gaps in historical data.
      </p>

      <h4>4.3 API Rate Limits</h4>
      <p>
        Radar's public API is subject to rate limiting to ensure fair access and
        service stability. Rate limits may be adjusted without notice. Excessive API
        usage may result in throttling or temporary blocks.
      </p>
    </section>

    <section>
      <h3>5. Email Notification Services</h3>

      <h4>5.1 Optional Subscription</h4>
      <p>
        Radar offers optional email notifications for network events. By subscribing,
        you consent to receive automated emails regarding:
      </p>
      <ul>
        <li>Validator status changes (online/offline, validation failures)</li>
        <li>Quorum set modifications</li>
        <li>Organization-level events</li>
        <li>Network-wide health alerts</li>
      </ul>

      <h4>5.2 Best-Effort Delivery</h4>
      <p>
        Email notifications are sent on a best-effort basis. We do not guarantee:
      </p>
      <ul>
        <li><strong>Delivery:</strong> Emails may be blocked by spam filters, delayed, or fail to send</li>
        <li><strong>Timeliness:</strong> Notifications may arrive minutes or hours after an event</li>
        <li><strong>Completeness:</strong> Not all events may trigger notifications</li>
        <li><strong>Accuracy:</strong> Notifications may contain false positives or outdated information</li>
      </ul>

      <h4>5.3 No Critical Alerting</h4>
      <p>
        <strong>Do not use Radar notifications for critical operational alerting.</strong>
        Email is not a reliable delivery mechanism for time-sensitive or
        mission-critical notifications. Implement redundant monitoring and alerting
        systems for production validator operations.
      </p>

      <h4>5.4 Subscription Management</h4>
      <p>
        You may unsubscribe from notifications at any time via:
      </p>
      <ul>
        <li>Unsubscribe links in notification emails</li>
        <li>Muting specific notification types</li>
        <li>Requesting full deletion of your subscription data</li>
      </ul>
      <p>
        For privacy details, see our Privacy Policy.
      </p>
    </section>

    <section>
      <h3>6. Validator Services Inquiries</h3>

      <h4>6.1 Contact Form Submissions</h4>
      <p>
        Radar includes a contact form for inquiries about professional validator
        hosting and setup services. By submitting a contact form inquiry, you
        acknowledge that:
      </p>
      <ul>
        <li>Your inquiry does not create a binding agreement or service commitment</li>
        <li>We will respond within 24 business hours where commercially reasonable</li>
        <li>Specific pricing, terms, and SLAs will be provided separately</li>
        <li>Any professional services engagement requires a separate written agreement</li>
      </ul>

      <h4>6.2 Separate Terms for Hosted Services</h4>
      <p>
        If you engage Obsrvr for validator hosting or setup services, those services
        will be governed by a separate written agreement that includes:
      </p>
      <ul>
        <li>Specific Service Level Agreements (SLAs)</li>
        <li>Uptime guarantees and remediation procedures</li>
        <li>Security and compliance requirements</li>
        <li>Payment terms and pricing</li>
        <li>Support channels and response times</li>
      </ul>
      <p>
        The terms in this Radar Addendum do <strong>not</strong> apply to hosted
        validator services unless explicitly incorporated by reference.
      </p>
    </section>

    <section>
      <h3>7. Data and Content Policies</h3>

      <h4>7.1 Public Blockchain Data</h4>
      <p>
        As stated in the Master Terms, data collected from the Stellar network is
        publicly available blockchain data. Radar's value lies in aggregating,
        analyzing, and presenting this data in useful ways.
      </p>

      <h4>7.2 User-Submitted Metadata</h4>
      <p>
        If you submit validator or organization metadata (e.g., via TOML files or
        contact forms), you represent that:
      </p>
      <ul>
        <li>You have the right to provide such information</li>
        <li>The information is accurate and not misleading</li>
        <li>You will update information if it changes or becomes inaccurate</li>
      </ul>

      <h4>7.3 Community Data</h4>
      <p>
        Radar may incorporate community-maintained data sources (validator lists,
        organization mappings, etc.). We make reasonable efforts to verify such data
        but do not guarantee its accuracy.
      </p>
    </section>

    <section>
      <h3>8. Modifications to Radar</h3>

      <h4>8.1 Feature Changes</h4>
      <p>
        We may add, modify, or remove Radar features at any time. We will make
        commercially reasonable efforts to:
      </p>
      <ul>
        <li>Maintain backward compatibility for public APIs</li>
        <li>Provide advance notice of breaking changes</li>
        <li>Offer migration paths for deprecated features</li>
      </ul>

      <h4>8.2 Experimental Features</h4>
      <p>
        Radar may include experimental or beta features marked as such. These
        features:
      </p>
      <ul>
        <li>Are provided without warranties of any kind</li>
        <li>May change or be removed without notice</li>
        <li>May have bugs or incomplete functionality</li>
        <li>Are not suitable for production-critical use</li>
      </ul>
    </section>

    <section>
      <h3>9. Intellectual Property</h3>

      <h4>9.1 Radar-Specific IP</h4>
      <p>
        In addition to the IP provisions in the Master Terms, the following applies
        specifically to Radar:
      </p>
      <ul>
        <li>The "Radar" name and branding are trademarks of Obsrvr</li>
        <li>Radar's network analysis algorithms and methodologies are proprietary</li>
        <li>Visualization designs and user interfaces are protected by copyright</li>
        <li>Historical data aggregations and derived metrics are proprietary works</li>
      </ul>

      <h4>9.2 Fair Use</h4>
      <p>
        You may:
      </p>
      <ul>
        <li>Reference Radar data in research or analysis with proper attribution</li>
        <li>Share screenshots or links to Radar pages</li>
        <li>Use the public API according to published rate limits</li>
      </ul>
      <p>
        You may not:
      </p>
      <ul>
        <li>Rebrand or white-label Radar for commercial purposes</li>
        <li>Scrape or bulk-download data outside of the public API</li>
        <li>Create derivative monitoring tools that replicate Radar's core functionality</li>
      </ul>
    </section>

    <section>
      <h3>10. Contact and Support</h3>

      <h4>10.1 Support Channels</h4>
      <p>
        For Radar support, you may:
      </p>
      <ul>
        <li>Email: <a href="mailto:hello@withobsrvr.com">hello@withobsrvr.com</a></li>
        <li>Submit issues via our public GitHub repository (if applicable)</li>
        <li>Review documentation and API guides</li>
      </ul>

      <h4>10.2 Support Expectations</h4>
      <p>
        Unless you have a separate support agreement, support is provided on a
        best-effort, community basis. We do not guarantee:
      </p>
      <ul>
        <li>Response times for support inquiries</li>
        <li>Resolution of bugs or feature requests</li>
        <li>Availability of support outside business hours</li>
      </ul>
    </section>

    <hr class="my-4" />

    <div class="text-muted small">
      <p>
        <strong>Document Version:</strong> Radar Addendum v1.0<br>
        <strong>Effective Date:</strong> December 29, 2025<br>
        <strong>Applies To:</strong> Obsrvr Radar Service<br>
        <strong>Supplements:</strong> Obsrvr Master Terms of Service v1.0
      </p>
      <p class="mt-3">
        <em>For inquiries about these terms or Radar services, contact
        <a href="mailto:hello@withobsrvr.com">hello@withobsrvr.com</a></em>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
// Static legal content - no reactive data needed
</script>

<style scoped>
.legal-content {
  line-height: 1.8;
}

.legal-content section {
  margin-bottom: 2.5rem;
}

.legal-content h2 {
  font-size: 1.75rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: #2c3e50;
  border-bottom: 2px solid #e0e0e0;
  padding-bottom: 0.5rem;
}

.legal-content h3 {
  font-size: 1.4rem;
  font-weight: 600;
  margin-top: 2rem;
  margin-bottom: 1rem;
  color: #34495e;
}

.legal-content h4 {
  font-size: 1.1rem;
  font-weight: 600;
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
  color: #546e7a;
}

.legal-content p {
  margin-bottom: 1rem;
}

.legal-content ul,
.legal-content ol {
  margin-bottom: 1rem;
  padding-left: 2rem;
}

.legal-content li {
  margin-bottom: 0.5rem;
}

.legal-content a {
  color: #1997c6;
  text-decoration: none;
}

.legal-content a:hover {
  text-decoration: underline;
}

.alert-info {
  background-color: #e3f2fd;
  border-color: #90caf9;
  color: #1565c0;
}
</style>
