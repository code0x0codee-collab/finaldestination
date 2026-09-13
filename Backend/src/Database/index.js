import mysql from "mysql2/promise"

// const pool = mysql.createPool({
//     host: "localhost",
//     user:"root",
//     password: "root",
//     database: "uietautomation"
// })
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT || 3306),
  waitForConnections: true,
  connectionLimit: 10
});
const connectDB = async() =>{
    try{
        pool.getConnection((err, connection) =>{
            if(err){
                console.error("Error connecting to the database:", err);
                return;
            }
            console.log("Connected to the database.");
            connection.release();
        });
    }catch(error){
        console.error("Error connecting to the database:", error);
    }
}


export  { connectDB , pool };
