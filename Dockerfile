#
# Stage for building the project
#
FROM node:current-alpine AS build

WORKDIR /usr/app

# Copy over project files
COPY package-lock.json package.json tsconfig.json ./
COPY ./src ./src

# Install dependencies and build project
RUN npm install && npm run build


#
# Stage for starting the container
#
FROM node:current-alpine AS run

# Copy build output from 'build' stage
COPY --from=build /usr/app/build /usr/app
COPY --from=build /usr/app/package.json /usr/app
COPY --from=build /usr/app/package-lock.json /usr/app

# Install needed dependecies for prod
WORKDIR /usr/app/build
RUN npm install --only=prod

# Run prod command when running container
CMD npm run prod