# HealthFlow AI – Frontend

## Overview
This repository contains the frontend interface for **HealthFlow AI**, a structured, role-based clinical workflow system integrating MedGemma within a human-supervised hospital environment.
The frontend provides clear role separation and controlled AI interaction across:
- Receptionist
- Doctor
- Nurse
- Pharmacist
- Administrator
The interface is designed to support structured coordination, reduce communication gaps, and enable safe AI-assisted explanation generation.

## System Workflow
Receptionist → Doctor → AI Explanation → Doctor Approval → Nurse → Pharmacist → Admin Analytics
The frontend visually enforces this structured workflow, ensuring each role operates within defined boundaries.

## Role-Based Interfaces
### Receptionist
- Patient registration
- Case initiation
- Digital record creation
### Doctor
- Structured clinical note entry
- Prescription documentation
- Test and bed allocation recording
- Trigger AI explanation generation
- Review and approve AI output
### Nurse
- Bed allocation management
- Diagnostic test coordination
- Workflow progression updates
### Pharmacist
- Prescription review
- Medicine dispensing
- Display of doctor-approved explanation
### Administrator
- Consultation metrics monitoring
- AI usage statistics
- Approval rate tracking
- Operational workflow analytics
## AI Interaction Model
The frontend connects to the FastAPI backend to:
1. Submit structured clinical notes
2. Trigger MedGemma explanation generation
3. Display AI-generated output
4. Enforce mandatory doctor approval before patient visibility
This ensures responsible AI integration within a controlled healthcare workflow.

## Design Principles
The frontend was built with the following priorities:
- Clear role separation
- Minimal cognitive overload
- Structured workflow visualization
- Transparent AI assistance
- Administrative oversight capability

## Running Locally
If using a Node-based environment:
npm install  
npm start  
If static frontend:
Open index.html in a browser or run a simple local development server.
## Repository Structure
All frontend files are placed directly in the root of this repository.
There is no separate `frontend/` subfolder.
This flat structure was intentionally used for clarity and submission simplicity.

## Deployment
The frontend is designed to connect to a FastAPI backend instance.
The architecture supports scalable deployment in conjunction with GPU-backed inference environments.
