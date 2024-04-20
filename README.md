# College-Connect
College Connect is a comprehensive web platform that fosters communication and collaboration within college communities. With a Reddit-style interface and various features such as Lost and Found, Hostel Finder, Q&A, and more, College Connect aims to enhance the college experience for students and faculty alike. 

## Features
- Create, read, update and delete posts
- Like and unlike posts
- Create, reply to, read, update and delete nested comments
- Markdown for posts and comments
- Sign up and login using JWT for authentication
- Private message users in real-time using socket.io
- View profiles of users and browse through their posts, liked posts and comments
- Sort posts by attributes such as like count, comment count and date created
- Update bio which can be viewed by other users
- Search for posts by their title
- View the users who liked a particular post
- Fully responsive layout

## Installation and usage
1) Clone this repository  
```
git clone https://github.com/aniketh4/College_connect
```
2) Install dependencies  
```
cd College-connect  
npm install
cd client
npm install
```
3) Create .env in root directory
```
cd ..
touch .env
```
4) Configure environment variables in your new .env file. To acquire your MONGO_URI, create a cluster for free over at https://www.mongodb.com/. The TOKEN_KEY is a secret key of your choosing, you can generate one at this site: https://randomkeygen.com/.
```
MONGO_URI=<YOUR_MONGO_URI> 
TOKEN_KEY=<YOUR_TOKEN_KEY>
PORT=4000
```
5) Run the server
```
npm run server
```
6) Start a new terminal and run react's development server
```
cd social-media-app
cd client
npm start
```
