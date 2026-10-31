Open Business AI 🤖
AI-Powered Customer Support Assistant for Small Businesses
Open Business AI is an open-source AI-powered customer support assistant designed to help small businesses automate customer interactions using their own business knowledge.
The system uses open-weight AI models through Ollama and dynamically loads business information from Markdown-based knowledge packs. It generates context-aware customer responses, answers frequently asked questions, provides product and service information, and escalates complex or unsupported queries to human staff.
The platform supports multiple businesses, each with its own independent knowledge base.
________________________________________
✨ Key Features
•	AI-Powered Customer Support: Generates natural-language responses using an open-weight Gemma model.
•	Markdown-Based Knowledge Packs: Stores business information, pricing, FAQs, policies, and procedures in structured Markdown files.
•	Multi-Business Support: Supports multiple businesses with isolated knowledge contexts.
•	Dynamic Business Discovery: Automatically discovers business folders and extracts business metadata.
•	Context-Aware Responses: Uses business-specific information to answer customer questions.
•	Human Escalation: Escalates complaints, unsupported requests, sensitive inquiries, and questions requiring human intervention.
•	Conversation Context: Supports conversation history to maintain context during customer interactions.
•	Configurable AI Inference: Connects to locally hosted Ollama models with configurable model names, server URLs, and timeouts.
•	REST API: Provides FastAPI endpoints for business discovery, knowledge retrieval, and customer conversations.
________________________________________
🏢 Demo Businesses
The project currently includes two fictional businesses.
1. Sweet Home Kitchen
An artisanal neighbourhood bakery specializing in handcrafted celebration cakes, sourdough breads, and morning pastries.
The AI assistant can:
•	Answer questions about cake varieties and pricing.
•	Explain available sizes and customization options.
•	Provide delivery and pickup information.
•	Explain ordering procedures and advance notice requirements.
•	Escalate refund requests, complaints, and special cake requirements.
2. Elite Properties
A boutique real estate agency offering residential rentals, luxury property sales, and commercial leasing.
The AI assistant can:
•	Provide information about available property listings.
•	Answer questions about rental prices and property specifications.
•	Explain lease terms and security deposits.
•	Provide property viewing procedures.
•	Escalate price negotiations, legal inquiries, and formal property offers.
All business details and listings included in the demonstration are fictional.
________________________________________
🛠️ Technology Stack
Component	Technology
Frontend	React + Vite
Backend	Python, FastAPI
AI Model	Gemma 2:2b
AI Runtime	Ollama
Knowledge Storage	Markdown files
API Documentation	Swagger UI
Data Validation	Pydantic
Version Control	Git and GitHub
________________________________________
🏗️ System Architecture
                  CUSTOMER
                      |
                      v
              REACT FRONTEND
                      |
                      v
               FASTAPI BACKEND
                      |
          +-----------+-----------+
          |                       |
          v                       v
    BUSINESS PACK              AI SERVICE
       LOADER                      |
          |                        v
          v                  OLLAMA RUNTIME
    MARKDOWN FILES                 |
          |                        v
          +----------------> GEMMA 2:2B
                                   |
                                   v
                            GENERATED REPLY
                                   |
                                   v
                          RESPONSE VALIDATION
                                   |
                                   v
                         SUCCESS / ESCALATION
                                   |
                                   v
                              FRONTEND
How It Works
1.	A customer selects a business and sends a message.
2.	The React frontend sends the request to the FastAPI backend.
3.	The backend identifies the selected business.
4.	The Markdown business pack loader retrieves the relevant business information.
5.	The AI service combines the business knowledge with the customer message and conversation history.
6.	Gemma generates a response through Ollama.
7.	The backend validates the response and determines whether it should be returned normally or escalated.
8.	The response is sent back to the frontend.
________________________________________
📁 Project Structure
hacktoberfest_teamrocket/
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── routes.py
│   │   │   └── schemas.py
│   │   │
│   │   ├── services/
│   │   │   ├── ai_service.py
│   │   │   └── pack_loader.py
│   │   │
│   │   ├── config.py
│   │   └── main.py
│   │
│   ├── requirements.txt
│   └── test_backend.py
│
├── business-packs/
│   ├── sweet-home-kitchen/
│   │   ├── profile.md
│   │   ├── pricing_menu.md
│   │   ├── faqs.md
│   │   └── ordering_procedure.md
│   │
│   └── elite-properties/
│       ├── profile.md
│       ├── property_listings.md
│       ├── faqs.md
│       └── booking_procedure.md
│
├── frontend/
│   └── (React application)
│
├── IMPLEMENTATION_PLAN.md
├── .gitignore
└── README.md
________________________________________
⚙️ Installation and Setup
Prerequisites
Install the following:
•	Python 3.10 or later (use a version compatible with the project's dependencies).
•	Node.js and npm (for the React frontend).
•	Ollama.
•	Git.
1. Clone the Repository
git clone https://github.com/aditeedessai/hacktoberfest_teamrocket.git

cd hacktoberfest_teamrocket
2. Install and Configure Ollama
Download Ollama from:
https://ollama.com/download
Pull the configured Gemma model:
ollama pull gemma2:2b
Verify the installation:
ollama list
Ensure that the Ollama application is running before starting AI inference.
3. Set Up the Backend
Navigate to the backend directory:
cd backend
Create a Python virtual environment:
python -m venv venv
Activate the virtual environment.
Windows PowerShell:
.\venv\Scripts\Activate.ps1
Windows Command Prompt:
venv\Scripts\activate
Linux / macOS:
source venv/bin/activate
Install the required dependencies:
pip install -r requirements.txt
4. Configure AI Settings
The backend uses centralized configuration for Ollama.
Default configuration:
Variable	Default Value	Description
OLLAMA_BASE_URL	http://localhost:11434	Ollama server address
DEFAULT_MODEL	gemma2:2b	AI model used for inference
OLLAMA_TIMEOUT	120.0 seconds	Maximum inference request timeout
These settings can be overridden using environment variables.
For example, in Windows PowerShell:
$env:OLLAMA_BASE_URL="http://localhost:11434"
$env:DEFAULT_MODEL="gemma2:2b"
$env:OLLAMA_TIMEOUT="120"
5. Start the Backend
From the backend directory, with the virtual environment activated:
python -m uvicorn app.main:app --reload --port 8000
The backend will be available at:
http://localhost:8000
6. Access API Documentation
Open the interactive Swagger documentation:
http://localhost:8000/docs
________________________________________
🔌 API Endpoints
The backend exposes the following REST API endpoints.
Method	Endpoint	Description
GET	/	Root endpoint
GET	/api/health	Check backend health
GET	/api/businesses	Retrieve available businesses
GET	/api/businesses/{business_id}/pack	Retrieve a business knowledge pack
POST	/api/chat	Generate an AI customer response
PUT	/api/businesses/{business_id}/pack	Update an existing Markdown knowledge file
Chat API Example
Endpoint:
POST /api/chat
Request:
{
  "business_id": "sweet-home-kitchen",
  "message": "What cakes do you offer and what are their prices?",
  "conversation_history": []
}
Successful Response:
{
  "reply": "We offer three signature celebration cakes...",
  "status": "success",
  "business_id": "sweet-home-kitchen",
  "escalation_reason": null
}
Escalation Response:
{
  "reply": "I'll connect you with a team member who can help.",
  "status": "escalated",
  "business_id": "sweet-home-kitchen",
  "escalation_reason": "The requested information requires human assistance."
}
________________________________________
📚 Business Knowledge Packs
Each business has its own directory containing Markdown files.
The knowledge pack structure allows businesses to customize their information without changing backend source code.
Knowledge Pack Components
File	Purpose
profile.md	Business identity, contact information, location, and operating hours
pricing_menu.md	Products, services, prices, and customization options
faqs.md	Frequently asked customer questions and answers
ordering_procedure.md	Ordering workflow and escalation rules
property_listings.md	Property details and available listings
booking_procedure.md	Property viewing and booking procedures
Adding a New Business
To add another business:
1.	Create a new folder inside business-packs/.
2.	Add a profile.md containing the business name, category, and description.
3.	Add relevant Markdown files containing business information.
4.	Follow the existing Markdown structure.
5.	Restart or refresh the backend as appropriate.
The business pack loader discovers available businesses dynamically.
________________________________________
🛡️ AI Safety and Human Escalation
Open Business AI is designed to reduce unsupported AI-generated information.
The AI assistant follows business-specific knowledge and escalation instructions.
Examples of escalation scenarios include:
•	Unknown products or services.
•	Unsupported customization requests.
•	Refund disputes and complaints.
•	Legal or financial questions requiring professional assistance.
•	Price negotiations.
•	Requests requiring human confirmation.
The assistant must not claim that an order, payment, delivery, or property viewing has been confirmed when no actual booking or payment system has completed that action.
________________________________________
🧪 Testing
Run the backend verification script from the backend directory with the virtual environment activated:
python test_backend.py
The backend verification suite checks:
•	Configuration and Pydantic schemas.
•	Input validation.
•	Business pack discovery.
•	Markdown metadata extraction.
•	Path traversal protection.
•	Markdown file updates.
•	AI service integration checks.
•	API endpoints.
•	CORS configuration.
Automated tests can mock AI inference so that the test suite does not require a running Gemma model.
For actual AI verification, ensure Ollama is running and test the chat endpoint through Swagger.
________________________________________
💾 Database
The current prototype does not require a database.
Business information is stored in Markdown files and loaded dynamically by the backend. Conversation history can be supplied through API requests.
Persistent conversation storage, customer accounts, order records, and booking management can be added in future versions.
________________________________________
🚀 Future Enhancements
Potential future improvements include:
•	Persistent customer conversations.
•	Database integration for orders and booking requests.
•	Business owner dashboard for knowledge pack management.
•	Additional business templates and industries.
•	Human agent dashboard for escalated conversations.
•	Real messaging platform integrations.
•	Conversation analytics and reporting.
•	Support for additional open-weight AI models.
________________________________________
👥 Team
Team Rocket — Open Business AI
Developed as a hackathon project focused on making AI-powered customer support more accessible to small businesses.
________________________________________
📄 License
This project is intended as an open-source hackathon prototype. Add a repository license file if you intend to distribute it under a specific open-source license.
________________________________________
Open Business AI — Making AI-powered customer support accessible to every business.


