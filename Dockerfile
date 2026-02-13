# 1. Use Node 22 (Alpine) to satisfy your ">=20" engine requirement
FROM node:22

# 2. Set working directory
WORKDIR /app

# 3. Copy package files first for better caching
COPY package.json package-lock.json ./

# 4. Install dependencies
# We use --legacy-peer-deps because React Native and React 19 
# sometimes have conflicting peer dependencies in the npm ecosystem.
RUN npm install --legacy-peer-deps

# 5. Copy the rest of the source code
COPY . .

# 6. Expose the port used by Webpack
# Webpack Dev Server defaults to 8080. 
# If your webpack.config.js sets a different port, change it here.
EXPOSE 8080

# 7. Start the web development server
# This runs "webpack serve --mode development" from your scripts
CMD ["npm", "run", "web"]
