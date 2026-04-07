# NEURO AI: System Architecture & Implementation Guidelines

## 1. System Architecture

### Frontend (The Interactive Notebook)
- **Framework:** Next.js 15+ (App Router)
- **Styling:** Tailwind CSS v4 with custom skeuomorphic "book" components.
- **Animations:** Framer Motion for realistic 3D page flips (`rotateY`) and spring-based sticky note interactions.
- **State Management:** React Context/Hooks for complexity levels, search queries, and navigation state.

### AI Engine (The Cognitive Core)
- **Model:** Gemini 3 Flash (`gemini-3-flash-preview`) for real-time expression analysis and "Teach the Teacher" conversational logic.
- **Multimodal Input:** 
  - **Vision:** Real-time frame analysis via `generateContent` to detect user frustration, boredom, or engagement.
  - **Text/Voice:** Processing student explanations in "Teach the Teacher" mode to evaluate conceptual depth.

### Backend & Persistence
- **Database:** Firebase Firestore for storing:
  - User Profiles (Learning preferences, complexity defaults).
  - Study Logs (Time spent per chapter, complexity adjustments).
  - Progress (Syllabus completion markers).
- **Auth:** Firebase Authentication (Google Login).

---

## 2. Conversational AI Behavior Guidelines

### Tone & Voice
- **Empathetic & Supportive:** Use phrases like "I see this part is a bit tricky," or "You're doing great, let's look at this differently."
- **Non-Competitive:** Avoid high-pressure language. Focus on growth and curiosity.

### Cognitive Load Adaptation
- **Detection:** If the camera detects "confusion" or if there's a 30s period of inactivity on a complex paragraph.
- **Action:** Automatically trigger a "Hint" sticky note.
- **Simplification:** If the user adjusts the Complexity Slider, the AI should re-summarize the current view to match the new level.

### "Teach the Teacher" Mode
- **Roleplay:** The AI acts as a curious, slightly confused student.
- **Scaffolding:** If the student's explanation is incomplete, the AI asks a leading question: "That makes sense, but what happens to the signal once it reaches the synapse?"

---

## 3. Database Schema (Firestore)

### `users` (Collection)
- `uid`: string (Primary Key)
- `displayName`: string
- `email`: string
- `preferences`: {
    `learningStyle`: "visual" | "auditory" | "kinesthetic",
    `defaultComplexity`: number (0-100)
  }

### `progress` (Collection)
- `uid`: string (Foreign Key)
- `topicId`: string
- `status`: "not_started" | "in_progress" | "completed"
- `lastAccessed`: timestamp

### `study_logs` (Collection)
- `uid`: string (Foreign Key)
- `topicId`: string
- `duration_minutes`: number
- `complexity_used`: number
- `timestamp`: timestamp

### `achievements` (Collection)
- `uid`: string (Foreign Key)
- `type`: "streak" | "mastery" | "curiosity"
- `dateEarned`: timestamp
