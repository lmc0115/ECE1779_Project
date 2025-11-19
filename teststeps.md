## **✅ 1\. Login (to get a new token anytime)**

**POST**  
 `http://localhost:8080/api/auth/login`

`{`  
  `"email": "muchen.liu1@outlook.com",`  
  `"password": "123456"`  
`}`

You’ll get:

`{`  
  `"user": {...},`  
  `"token": "..."`  
`}`

---

## **✅ 2\. Create an Event (requires Authorization)**

**POST**  
 `http://localhost:8080/api/events`

### **Headers:**

`Authorization: Bearer <your_token_here>`  
`Content-Type: application/json`

### **Body:**

`{`  
  `"title": "Chess Night",`  
  `"description": "Casual play for all levels.",`  
  `"location": "Student Center",`  
  `"faculty": "Engineering",`  
  `"category": "Clubs",`  
  `"start_time": "2025-01-20T18:00:00Z",`  
  `"end_time": "2025-01-20T20:00:00Z"`  
`}`

---

## **✅ 3\. Get all events**

**GET**  
 `http://localhost:8080/api/events`

---

## **✅ 4\. RSVP to an event**

**POST**  
 `http://localhost:8080/api/events/1/rsvps`

### **Headers:**

`Authorization: Bearer <token>`  
`Content-Type: application/json`

### **Body:**

`{`  
  `"status": "going"`  
`}`

---

## **✅ 5\. Comment on an event**

**POST**  
 `http://localhost:8080/api/events/1/comments`

### **Body:**

`{`  
  `"body": "Looking forward to it!"`  
`}`

