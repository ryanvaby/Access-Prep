# Access Prep - Financial Document Assistant

An AI-powered application that helps non-traditional bank applicants (students, newcomers, gig workers, seasonal workers) understand and prepare the required documents for credit card, secured card, or bank account applications. The application features bilingual support (English/Spanish) and includes an intelligent chatbot powered by Google's Gemini AI that can validate uploaded documents.

## Features

- **Bilingual Interface**: Full support for English and Spanish
- **Multiple Applicant Pathways**: Tailored guidance for students, newcomers, gig workers, seasonal workers, and those unsure of their category
- **AI-Powered Chatbot**: Interactive assistant that answers questions about required documents and bank policies
- **Document Validation**: Upload and validate documents (ID, income proof, bank statements, etc.) using OCR and AI
- **Document Tracking**: Real-time tracking of validated documents and requirements
- **Financial Glossary**: Built-in glossary of financial terms in both languages
- **Responsive Design**: Clean, modern UI built with React and Tailwind CSS

## Tech Stack

### Frontend
- **React 19** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS 4** for styling
- **React Markdown** for chat message rendering

### Backend
- **Flask** (Python) REST API
- **LangChain** with Google Gemini 2.5 Flash Lite for AI capabilities
- **PyMuPDF** for PDF text extraction
- **Pytesseract** for OCR (Optical Character Recognition)
- **PIL (Pillow)** for image processing

## Prerequisites

Before running this project, ensure you have:

- **Node.js** (v18 or higher) and npm
- **Python 3.8+**
- **Tesseract OCR** installed on your system:
  - macOS: `brew install tesseract`
  - Linux: `sudo apt-get install tesseract-ocr`
  - Windows: Download from [GitHub](https://github.com/UB-Mannheim/tesseract/wiki)
- **Google Gemini API Key** (get one from [Google AI Studio](https://makersuite.google.com/app/apikey))

## Installation & Setup

### 1. Clone the Repository

```bash
cd Access-Prep-main
```

### 2. Backend Setup

```bash
# Navigate to the agent directory
cd agent

# Create a virtual environment (recommended)
python -m venv venv

# Activate the virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt

# Create a .env file and add your Google API key
echo "GOOGLE_API_KEY=your_api_key_here" > .env
```

### 3. Frontend Setup

```bash
# Navigate back to the root directory
cd ..

# Install Node.js dependencies
npm install
```

## Running the Application

You need to run both the backend and frontend servers:

### Terminal 1: Start the Backend Server

```bash
cd agent
source venv/bin/activate  # Activate virtual environment if not already active
python chatbot.py
```

The Flask backend will start on `http://127.0.0.1:5000`

### Terminal 2: Start the Frontend Development Server

```bash
npm run dev
```

The Vite development server will start on `http://localhost:5173` (or another port if 5173 is busy)

### Access the Application

Open your browser and navigate to `http://localhost:5173`

## Usage

1. **Select Your Pathway**: Choose which applicant category best describes you (student, newcomer, gig worker, seasonal worker, or not sure)

2. **Fill Out the Intake Form**: Provide basic information about your situation including:
   - State/Location
   - Credit history status
   - Income type
   - ID type available
   - Type of account you're applying for

3. **Start Chatting**: Ask the AI assistant questions about:
   - Required documents for your situation
   - Bank policies and requirements
   - Alternative documentation options
   - Specific questions about your application

4. **Upload Documents**: Upload your documents for validation:
   - The AI will extract text using OCR
   - Validate that required information is present
   - Track your progress toward completing your application

5. **Use the Glossary**: Click the "Glossary" button to view financial terms and their definitions in your preferred language

## Project Structure

```
Access-Prep-main/
├── agent/
│   ├── chatbot.py           # Flask backend with AI logic
│   ├── requirements.txt     # Python dependencies
│   └── .env                 # Environment variables (create this)
├── src/
│   ├── App.tsx             # Main React component
│   ├── components/
│   │   ├── Chat.tsx        # Chat interface component
│   │   ├── IntakeForm.tsx  # Initial form component
│   │   └── GlossaryModal.tsx # Financial glossary modal
│   ├── types.ts            # TypeScript type definitions
│   ├── i18n.ts             # Internationalization/translations
│   └── glossary.ts         # Financial terms glossary
├── package.json            # Node.js dependencies
└── vite.config.ts          # Vite configuration
```

## Available Scripts

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Backend
- `python agent/chatbot.py` - Start Flask server

## API Endpoints

The backend provides the following REST API endpoints:

- `POST /api/determine-required-documents` - Determine required documents based on user profile
- `POST /api/chat` - Send a chat message and get AI response
- `POST /api/upload-file` - Upload and validate a document
- `GET /api/files/<session_id>` - Get all uploaded files for a session
- `DELETE /api/file/<session_id>/<file_id>` - Delete a specific file

## Environment Variables

Create a `.env` file in the `agent/` directory with:

```
GOOGLE_API_KEY=your_google_gemini_api_key_here
```

## License

See [LICENSE](LICENSE) file for details.

## Contributing

This project was created for the C1 Hackathon. Contributions and improvements are welcome!
