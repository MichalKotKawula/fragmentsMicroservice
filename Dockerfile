#Dockerfile

#Stage: 0 

FROM node:18.17.1  AS dependencies

LABEL maintainer="Michal Kot-Kawula <mkot-kawula@myseneca.ca>"
LABEL description="Fragments node.js microservice"


ENV NODE_ENV=production

# We default to use port 8080 in our service
ENV PORT=8080

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
COPY package*.json /app/

# Copy src/
COPY ./src ./src

# Copy our HTPASSWD file
COPY ./tests/.htpasswd ./tests/.htpasswd

RUN npm install

######################################
#Stage 1
FROM node:18.17.1  AS deploy


WORKDIR /app

COPY --from=dependencies /app /app

COPY . .

# Run the server
CMD npm start
EXPOSE 8080


