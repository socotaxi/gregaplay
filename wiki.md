# Project Summary
Grega Play is a collaborative video montage application that allows users to create and edit videos together in real-time. This Progressive Web App (PWA) utilizes Supabase for backend services, including user authentication and data storage. The platform enhances the shared video experience with features like event management, video submissions, automated video editing, and a comprehensive invitation system, ensuring a seamless and engaging user experience.

# Project Module Description
- **User Authentication**: Manages user registration and login via Supabase, with robust profile fetching and error handling.
- **Video Processing**: Facilitates video uploads and real-time editing.
- **Media Recording**: Utilizes the MediaRecorder API for capturing video.
- **UI Components**: Built with Tailwind CSS for a responsive design.
- **Event Management**: Users can create events, invite participants, and manage submissions with improved error handling.
- **Error Handling**: Implements an ErrorBoundary component for effective error management with detailed feedback.
- **Participant Management**: Enhanced functionality for adding participants to events with a non-blocking processing system.
- **Invitation System**: Includes email invitations with unique tokens, allowing users to invite others to events with personalized messages and a streamlined registration process.
- **Event Deletion**: Users can delete events from their dashboard, with confirmation prompts and cascade deletion of associated data.

# Directory Tree
```
.
├── PRD_Application_Montage_Video_Collaboratif.md          # Project Requirements Document
├── app_montage_video_collaboratif_class_diagram.mermaid   # Class diagram for the application
├── app_montage_video_collaboratif_system_design.md         # System design document
├── grega_play_sequence_diagram.mermaid                     # Sequence diagram for video processing
├── grega_play_system_design.md                              # Overview of system architecture
├── .env.example                                             # Example environment variables for Supabase
├── supabase_schema_setup.sql                               # SQL script to set up database schema
├── supabase_missing_tables.sql                              # SQL script to create missing tables
├── supabase_add_description_column.sql                     # SQL script to add the missing 'description' column to the 'events' table
├── supabase_fix_invitations_table.sql                      # SQL script to fix the invitations table structure
└── react_template/                                         # React application template
    ├── README.md                                           # Overview and setup instructions
    ├── eslint.config.js                                     # ESLint configuration file
    ├── index.html                                          # Main HTML file
    ├── package.json                                        # Project dependencies and scripts
    ├── postcss.config.js                                    # PostCSS configuration
    ├── public/data/example.json                             # Example data for the application
    ├── src/                                               # Source files for the React app
    │   ├── App.jsx                                        # Main application component
    │   ├── components/                                    # UI components
    │   │   ├── auth/                                     # Authentication components
    │   │   │   ├── LoginForm.jsx                         # Login form component
    │   │   │   └── RegisterForm.jsx                      # Registration form component
    │   │   └── layout/                                   # Layout components
    │   │       ├── MainLayout.jsx                        # Main layout component
    │   │       └── Navbar.jsx                            # Navigation bar component
    │   │       └── ui/                                   # UI elements
    │   │           ├── Button.jsx                        # Button component
    │   │           └── Loading.jsx                       # Loading spinner component
    │   ├── context/                                       # Context API for state management
    │   │   └── AuthContext.jsx                           # Authentication context
    │   ├── index.css                                      # Main CSS file
    │   ├── lib/                                          # Library files
    │   │   └── supabaseClient.js                         # Supabase client configuration
    │   ├── main.jsx                                       # Entry point for the React application
    │   └── services/                                     # Service files for API interactions
    │       ├── emailService.js                           # Email service for sending invitations
    │       ├── eventService.js                           # Event-related services
    │       ├── invitationService.js                       # Invitation management services
    │       ├── notificationService.js                    # Notification services
    │       ├── videoProcessingService.js                 # Video processing services
    │       └── videoService.js                           # Video handling services
    ├── tailwind.config.js                                  # Tailwind CSS configuration
    └── vite.config.js                                      # Vite configuration for build
```

# File Description Inventory
- **PRD_Application_Montage_Video_Collaboratif.md**: Contains project requirements.
- **System Design Documents**: Outline the application's architecture and design.
- **.env.example**: Template for environment variables required for Supabase configuration.
- **supabase_schema_setup.sql**: SQL script for setting up the database schema.
- **supabase_missing_tables.sql**: SQL script to create missing tables and related policies.
- **supabase_add_description_column.sql**: SQL script to add the missing 'description' column to the 'events' table.
- **supabase_fix_invitations_table.sql**: SQL script to fix the invitations table structure with all required columns.
- **supabase_get_invited_events_function.sql**: Adds a helper function to retrieve events for invited users.
- **supabase_get_user_events_function.sql**: Returns all events a user created or is invited to.
- **React Template Files**: Includes all components and configurations for the React application, including services for video, invitations, and notifications.

# Technology Stack
- **Frontend**: React, Tailwind CSS, Vite
- **Backend**: Supabase (for authentication and real-time data)
- **APIs**: MediaRecorder API for video recording

# Usage
1. Create a `.env` file based on `.env.example` and add your Supabase credentials.
2. Install dependencies using `pnpm install`.
3. Build the project with `pnpm run build`.
4. Run the application using `pnpm run dev`.
