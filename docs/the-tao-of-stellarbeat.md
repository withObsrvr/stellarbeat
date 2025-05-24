# The Tao of Stellarbeat

## Introduction

This document aims to capture the architectural philosophy and design principles that guide the development of Stellarbeat (OBSRVR Radar). It serves both as a guide for contributors and as an explanation of the rationale behind our architectural decisions.

Stellarbeat was designed with a focus on maintainability, scalability, and separation of concerns. The architecture enables the application to evolve alongside the Stellar network it monitors, while maintaining a high level of code quality and developer experience.

## Core Principles

### 1. Framework-like Approach

Stellarbeat's internal architecture resembles a framework in many ways:

- **Consistent Patterns**: We use consistent design patterns throughout the codebase
- **Strong Abstractions**: Clear interfaces hide implementation details
- **Convention Over Configuration**: Established conventions reduce boilerplate
- **Rich Domain Model**: Expressive domain models capture business concepts
- **Infrastructure Separation**: Database access, HTTP handling, etc. are abstracted away
- **Inversion of Control**: Dependency injection provides service management
- **Standard Components**: Repositories, services, controllers follow consistent patterns
- **Strong Typing**: TypeScript interfaces provide contract-like guarantees

This approach creates a predictable, maintainable codebase that's easier to extend and contribute to.

### 2. Twelve-Factor App Methodology

Stellarbeat strictly follows the [Twelve-Factor App](https://12factor.net/) methodology:

1. **Codebase**: One codebase in version control, many deployments
2. **Dependencies**: Explicitly declare and isolate dependencies
3. **Config**: Store configuration in the environment
4. **Backing Services**: Treat backing services as attached resources
5. **Build, Release, Run**: Strictly separate build and run stages
6. **Processes**: Execute the app as one or more stateless processes
7. **Port Binding**: Export services via port binding
8. **Concurrency**: Scale out via the process model
9. **Disposability**: Maximize robustness with fast startup and graceful shutdown
10. **Dev/Prod Parity**: Keep development, staging, and production as similar as possible
11. **Logs**: Treat logs as event streams
12. **Admin Processes**: Run admin/management tasks as one-off processes

This adherence to twelve-factor principles ensures our application is cloud-native, scalable, and maintainable.

### 3. Domain-Driven Design

The codebase is organized according to Domain-Driven Design (DDD) principles:

- **Ubiquitous Language**: We use consistent terminology derived from the Stellar domain
- **Bounded Contexts**: Clear boundaries between different aspects of the application
- **Entities and Value Objects**: Distinct domain objects with appropriate behaviors
- **Aggregates**: Clusters of related entities treated as a single unit
- **Repositories**: Provide collection-like interfaces to access domain objects
- **Domain Services**: Encapsulate domain operations that don't belong to entities
- **Application Services**: Orchestrate use cases involving multiple domain objects

DDD helps us model complex business domains effectively and maintain a clean separation of concerns.

### 4. Clean Architecture

We follow Clean Architecture principles to ensure the long-term maintainability of the codebase:

- **Domain Layer**: Core business logic and entities with no external dependencies
- **Application Layer**: Use cases that orchestrate domain entities to perform tasks
- **Infrastructure Layer**: Implementations of interfaces defined in inner layers
- **Interface Layer**: Controllers, DTOs, and adapters for external communication

This architectural style ensures that business rules are not contaminated by external concerns, making the application more maintainable and testable.

### 5. Microservices Architecture

Stellarbeat is composed of several services, each with its own responsibilities:

- **Frontend**: Vue.js-based dashboard for visualizing Stellar network
- **Backend API**: Core service exposing network data via RESTful endpoints
- **Network Scanner**: Crawls the Stellar network and records data
- **Users Service**: Handles user management and authentication
- **History Scanner**: Verifies Stellar history archives for errors

Each service is independently deployable and scalable, following the single responsibility principle.

## Implementation Details

### 1. Project Structure

The monorepo is organized into:

- **Apps**: Main application components
  - `backend`: Core server with network scanning, history coordination, and notification
  - `frontend`: Vue.js dashboard
  - `users`: User management service
  - `history-scanner`: History archive scanning service
- **Packages**: Shared library components
  - `shared`: Common code and models
  - `crawler`: Network crawler implementation
  - Additional utility packages

### 2. Technology Stack

- **Language**: TypeScript for type safety and better developer experience
- **Backend**: Node.js with Express
- **Frontend**: Vue.js with TypeScript
- **Database**: PostgreSQL for relational data storage
- **ORM**: TypeORM for database interactions
- **Dependency Injection**: InversifyJS for IoC container
- **Configuration**: Environment variables with validation
- **Logging**: Structured logging with Pino
- **Testing**: Jest for unit and integration tests
- **CI/CD**: GitHub Actions for continuous integration and deployment
- **Infrastructure**: Terraform for infrastructure as code
- **Deployment**: DigitalOcean App Platform

### 3. Key Patterns

- **Repository Pattern**: Abstracts data access behind collection-like interfaces
- **Command Query Responsibility Segregation (CQRS)**: Separate models for read and write
- **Temporal Modeling**: Time-based snapshots of network state
- **Factory Pattern**: Creating complex objects with appropriate initialization
- **Strategy Pattern**: Interchangeable algorithms for various behaviors
- **Observer Pattern**: Event-based communication within the application
- **Adapter Pattern**: Converting between different interfaces

### 4. Development Workflow

- **Trunk-Based Development**: Short-lived feature branches merged frequently
- **Continuous Integration**: Automated testing on pull requests
- **Continuous Deployment**: Automated deployment to staging and production
- **Code Reviews**: Mandatory peer reviews for all changes
- **Testing**: Emphasis on unit and integration tests
- **Documentation**: In-code documentation and separate documentation files

## Contributing Guidelines

When contributing to Stellarbeat, keep these principles in mind:

1. **Respect Domain Boundaries**: Changes should respect the bounded contexts
2. **Follow Existing Patterns**: Use established patterns and conventions
3. **Maintain Clean Architecture**: Dependencies should point inward
4. **Write Tests**: All new code should have appropriate test coverage
5. **Consider Configurability**: Make features configurable where appropriate
6. **Document Why, Not Just How**: Explain rationale, not just implementation
7. **Performance Matters**: Consider performance implications, especially for network operations
8. **Minimize Dependencies**: Only add external dependencies when necessary
9. **Think Distributed**: Remember that components may be scaled independently
10. **Security First**: Always consider security implications of changes

## Why This Way?

You might wonder why we've chosen this particular approach to building Stellarbeat. Here's why:

- **Maintainability**: The architecture prioritizes long-term maintainability over short-term delivery
- **Scalability**: The microservices approach allows independent scaling of components
- **Separation of Concerns**: Clean boundaries make the codebase easier to understand and extend
- **Robustness**: The domain-driven approach ensures business rules are properly captured
- **Testability**: The architecture makes thorough testing easier and more effective
- **Developer Experience**: Consistent patterns and strong abstractions improve the development experience
- **Adaptability**: Clear interfaces make it easier to adapt to changes in the Stellar network
- **Operational Excellence**: The twelve-factor approach ensures cloud-native operations

## Conclusion

The Tao of Stellarbeat reflects a thoughtful approach to software architecture that prioritizes maintainability, scalability, and developer experience. By following these principles, we aim to create a codebase that's not just functional, but a pleasure to work with.

As you contribute to Stellarbeat, let these principles guide your decisions and help maintain the high standard of quality that makes this codebase feel like a framework rather than just an application.