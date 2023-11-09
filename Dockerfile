#Dockerfile

#Stage: 0 

FROM node:18.17.1@sha256:933bcfad91e9052a02bc29eb5aa29033e542afac4174f9524b79066d97b23c24  AS dependencies

LABEL maintainer="Michal Kot-Kawula <mkot-kawula@myseneca.ca>"
LABEL description="Fragments node.js microservice"



# Reduce npm spam when installing within Docker
# https://docs.npmjs.com/cli/v8/using-npm/config#loglevel
ENV NPM_CONFIG_LOGLEVEL=warn

# Disable colour when run inside Docker
# https://docs.npmjs.com/cli/v8/using-npm/config#color
ENV NPM_CONFIG_COLOR=false

# Use /app as our working directory
WORKDIR /app

# Explicit path - Copy the package.json and package-lock.json
# files into /app. NOTE: the trailing `/` on `/app/`, which tells Docker
# that `app` is a directory and not a file.
# COPY package*.json /app/

# Copy our HTPASSWD file
COPY ./tests/.htpasswd ./tests/.htpasswd

RUN npm ci --only=production

######################################
#Stage 1 building

FROM node:18.17.1@sha256:933bcfad91e9052a02bc29eb5aa29033e542afac4174f9524b79066d97b23c24  AS builder

ENV NODE_ENV production

COPY --chown=node:node --from=dependencies /app /app

WORKDIR /app

COPY --chown=node:node ./src ./src


######################################
#Stage 2 running

USER node
CMD ["node", "./src/server.js"]
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD curl --fail localhost:8080 || exit 1
