# RxPulse AWS EC2 Deployment Guide — 06 Route53 & SSL

This guide details how to configure domain names, obtain an SSL/TLS certificate from AWS Certificate Manager (ACM), validate it via Route53 DNS, and configure HTTPS on the Public ALB for **RxPulse**.

---

## 1. Prerequisites

- A registered domain name (e.g., `rxpulse.online`).
- Access to the AWS Account where Route53 manages DNS zones or control of the domain registration registrar to update nameservers.

---

## 2. Route53 Hosted Zone Creation

1. Navigate to the **Route53 Dashboard** in the AWS Console.
2. Click **Hosted zones** in the left navigation panel, then click **Create hosted zone**.
3. Set the details:
   - **Domain name**: `rxpulse.online`
   - **Type**: Public hosted zone
   - Click **Create hosted zone**.
4. AWS will generate a hosted zone and create **NS** (Name Server) and **SOA** records.
5. If your domain is registered outside AWS (e.g., GoDaddy, Namecheap), copy the 4 Name Server values from the NS record and update them in your domain registrar's custom DNS console.

---

## 3. Requesting ACM SSL Certificate

We will request a single certificate covering the root domain and all wildcards (`rxpulse.online` and `*.rxpulse.online`).

1. Open the **AWS Certificate Manager (ACM)** console.
2. Click **Request a certificate**, choose **Request a public certificate**, and click Next.
3. Configuration:
   - **Fully qualified domain name**: `rxpulse.online`
   - Click **Add another name to this certificate** and enter `*.rxpulse.online`
   - **Validation method**: **DNS validation** (Recommended)
   - **Key algorithm**: RSA 2048
   - Click **Request**.

### CLI Request Command:
```bash
ACM_CERT_ARN=$(aws acm request-certificate --domain-name rxpulse.online --validation-method DNS --subject-alternative-names "*.rxpulse.online" --output text --query 'CertificateArn')
```

---

## 4. Validating Certificate via Route53 DNS

Once requested, ACM will output CNAME records required for validating ownership of the domain.

1. In the ACM Console, click on your newly requested certificate.
2. Locate the **Domains** section.
3. Click **Create records in Route 53**.
4. Review the details, and click **Create records**. Route53 will automatically add the validation CNAME records to your hosted zone.
5. Wait for the status of the certificate to change from *Pending validation* to **Issued** (usually takes 5-10 minutes).

### CLI Check Validation Status Command:
```bash
aws acm wait certificate-validated --certificate-arn $ACM_CERT_ARN
```

---

## 5. Adding Route53 A-Records (Alias to ALB)

Create alias records pointing to the Public ALB.

1. Navigate back to **Hosted zones** in Route 53 and click on `rxpulse.online`.
2. Click **Create record**.
3. Choose **Simple routing** and click Next.
4. Click **Define simple record**.
   - **Record name**: Leave blank (points to root `rxpulse.online`)
   - **Value/Route traffic to**: Alias to Application Load Balancer
   - Choose your Region (e.g., `us-east-1`).
   - Select your Public ALB (`rxpulse-public-alb`).
   - Click **Define simple record**.
5. Repeat for wildcard/subdomain:
   - **Record name**: `www` (points to `www.rxpulse.online`) or `*`
   - **Value/Route traffic to**: Alias to Application Load Balancer
   - Select the same ALB.
   - Click **Define simple record**.
6. Click **Create records**.

---

## 6. Configuring HTTPS Listener on Public ALB

With the certificate issued, we can secure the Public ALB listeners.

1. Open the **EC2 Dashboard**, navigate to **Load Balancers**, and select `rxpulse-public-alb`.
2. Click the **Listeners** tab.
3. Click **Add listener**.
4. Configure HTTPS listener:
   - **Protocol**: HTTPS
   - **Port**: `443`
   - **Default actions**: Forward to target group `rxpulse-frontend-tg`
   - **Secure listener settings**:
     - **Security policy**: `ELBSecurityPolicy-TLS13-1-2-2021-06` (Recommended modern policy)
     - **Certificate source**: From ACM
     - **Certificate**: Select `rxpulse.online`
   - Click **Add**.

### Redirect HTTP (80) to HTTPS (443)
To ensure all traffic is encrypted:
1. Select the existing **HTTP:80 Listener** and click **Edit listener**.
2. Change the default action from *Forward to* to **Redirect to URL**.
3. Configuration:
   - **Protocol**: HTTPS
   - **Port**: `443`
   - **Status code**: 301 (Moved permanently)
   - Click **Save changes**.

Next, proceed to **[07-auto-scaling.md](file:///c:/Users/Admin/Desktop/RxPulse-1/aws-ec2-deployment/deployment-guides/07-auto-scaling.md)** to configure Auto Scaling Groups.
