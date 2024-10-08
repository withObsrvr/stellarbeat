# shared

Shared code between frontend and backend.

DTO classes like Node, Organization and Network are defined here and can be hydrated from the backend API responses.

Other code like the TrustGraph calculation is used in the backend to calculate and store stats for the live network, and is used in the frontend for simulation purposes.

install dependencies
`pnpm install`

build code:
`pnpm build`

## history
The history of this package can be found at https://github.com/stellarbeat/js-stellarbeat-shared

## todo:
extract API data models