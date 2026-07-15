MVP stage:
- monorepo with pnpm, typescript, turborepo
- Next.js app with web client, api gateway base features
- Prisma ORM and PostgresQL DB runed in docker locally
- Solid types for DTO, Models, API, etc.
- Features: Tracking for spending(CRUD), add Labels(like Food, Lidl, Car, Rent, etc. and CRUD for labels) 
- User management and simple Authentication via JWT.
- GitHub Actions pipeline 
- Simple AWS EC2 deploy

Post MVP stage:
- Unit test coverage 80+%
- move API Gateway to the NestJS microservice
- move Tracking, User management, Labels, etc to the separate microservices with NestJS
- Prisma ORM as a separate shared service/package
- Add Dashboards with budget statistics for week, month, YTD and custom range. Use D3.js for visualization.
- Add Assistance service with AI API integration. Add Analytic page with forecasts and budget analytics (regular/unregular spending, cost optimization, budgeting, etc.)
- Improve AWS infrastructure and deploy process
- Account management and shared accounts
- Import Transactions as CSV or JSON file