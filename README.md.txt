Installation of K6

1. winget install k6 --source winget
2. mkdir <file name>
3. <project file location>
	powershell -ExecutionPolicy Bypass -File .\run-k6-report.ps1


or 

1. npm install -g @apideck/postman-to-k6
2. Export Postman collection > collection> ... > export > collection v2.1> save file"billing.postman_collection.json"> put it inside billing.postman_collection.json
3. Convert collection to k6 <file location\k6_test> to create billing-k6.js
	postman-to-k6 billing.postman_collection.json -o billing-k6.js
4. Use :k6 run billing-k6.js"
5. CSV reporting> $output = & k6 run --quiet --log-format raw "$folder\billing-k6.js"
