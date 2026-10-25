# Private résumé service

Résumés use a dedicated SQLite-backed Durable Object database. The database records canonical career revisions, immutable résumé versions, PDF object keys and checksums, application submissions, and share links with view counts, expiration, and revocation. Share URLs are encrypted at rest and can be retrieved through the authenticated share-list endpoint.

PDFs live in a separate private R2 bucket, `private-resume-files`. The bucket is managed by the isolated Terraform configuration in `infra/resume`; it does not expose files through a public bucket domain. The Worker serves PDFs only after validating their share link or admin token.

## Provision and deploy

The Cloudflare helper reads `cloudflare_api_token` and `account_id` from `~/pixelating/web/infra/terraform/terraform.tfvars`. `PIXELATING_TFVARS` can override that path. Credentials are passed to Terraform and Wrangler through the environment.

The Cloudflare token must allow R2 management, Workers Scripts Edit, and the zone permissions required to attach `resume.pxl8.ing`. A token that cannot manage API tokens cannot grant itself additional permissions through Terraform.

Configure `private/resume-client.env` with `RESUME_API_URL=https://resume.pxl8.ing` and a random `RESUME_API_TOKEN` of at least 32 characters. The `private` directory is excluded from Git. The helper preserves a separate share URL encryption key in `private/resume-share-key`; retain that key across deployments.

```sh
npm run resume:cloudflare -- init
npm run resume:cloudflare -- plan
# Review the plan: it should only create the dedicated résumé bucket.
npm run resume:cloudflare -- provision
npm run resume:cloudflare -- deploy
```

Schema migrations run transactionally when the database starts. The deployment helper configures admin authentication and URL encryption secrets; private endpoints fail closed until authentication is configured.

## Create, render, and track links

```sh
npm run resume:import
npm run resume:new -- --company WCG --role "Full Stack Python Developer" --title "Full Stack Python Developer"
npm run resume:render -- RESUME_UUID --format pdf
npm run resume:share -- create RESUME_UUID --label "Jason Maroney"
npm run resume:share -- list RESUME_UUID
npm run resume:revoke -- SHARE_ID
```

Use `resume:new -- --file path/to/input.json` to select tailored bullets and skills. `resume:update -- RESUME_UUID --file path/to/patch.json` creates a new immutable version. A submitted application continues to reference the version originally sent.

The first PDF render saves the file in R2 and its metadata in SQLite. Later requests serve that stored PDF. Share-list access requires the admin token and returns the saved URLs and their tracking metadata.
