const mqtt = require('mqtt');
const mysql = require('mysql');
const dbConfig = require('../config/database'); // Import konfigurasi MySQL dari file config.js

const mqttClient = mqtt.connect('mqtt://mqtt.utdi.ac.id', {
    username: 'pkm2023',
    password: 'pkm123**'
});

const dbConnection = mysql.createConnection(dbConfig);

dbConnection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL database:', err);
        process.exit(1);
    }
    console.log('Connected to MySQL database');
});

// Subscribe ke topik MQTT
mqttClient.on('connect', () => {
    mqttClient.subscribe('sensor/pulseoximeter', (err) => {
        if (err) {
            console.error('Failed to subscribe to MQTT topic:', err);
        } else {
            console.log('Subscribed to MQTT topic: sensor/pulseoximeter');
        }
    });
});

// Menangani pesan yang diterima dari MQTT
mqttClient.on('message', (topic, message) => {
    if (topic === 'sensor/pulseoximeter') {
        const data = message.toString(); // Mengambil pesan sebagai string

        // Mencari nilai ToolID, Heart Rate, dan SpO2 dalam pesan
        const toolIDMatch = data.match(/ToolID:(\d+)/);
        const heartRateMatch = data.match(/Heart rate:([\d.]+) bpm/);
        const spo2Match = data.match(/SpO2:(\d+)%/);

        if (toolIDMatch && heartRateMatch && spo2Match) {
            const toolID = parseInt(toolIDMatch[1]);
            const heartRate = parseFloat(heartRateMatch[1]);
            const spo2 = parseInt(spo2Match[1]);

            // Simpan data ke database
            const insertQuery = `INSERT INTO measurement (tool_id, prbpm, spo2) VALUES (?, ?, ?)`;
            dbConnection.query(insertQuery, [toolID, heartRate, spo2], (err, result) => {
                if (err) {
                    console.error('Error inserting data into MySQL:', err);
                } else {
                    console.log('Data inserted into MySQL:', result);
                }
            });
        } else {
            console.error('Invalid data format:', data);
        }
    }
});
