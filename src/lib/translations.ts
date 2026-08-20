export type Language = 'es' | 'en';

export const translations = {
  es: {
    dashboard: {
      title: "Hola",
      level: "Nivel",
      globalProgress: "Progreso Global",
      mastered: "Dominados",
      learning: "Aprendiendo / Nuevos",
      startSession: "Comenzar sesión de estudio",
      modes: {
        world: { title: "Todo el Mundo", desc: "Mezcla banderas de todos los continentes." },
        continents: { title: "Por Continente", desc: "Enfócate en una región específica." },
        weaknesses: { title: "Repasar Errores", desc: "Practica las banderas que más te cuestan." },
        spatial: { title: "Mapa Espacial", desc: "Adivina qué país está marcado en el globo terráqueo." },
        global: { title: "Tu Mapa Global", desc: "Visualiza tu progreso en el mundo." }
      },
      tabs: {
        progress: "Mi Progreso",
        ranking: "Ranking Global"
      },
      logout: "Cerrar sesión"
    },
    leaderboard: {
      title: "Ranking Global",
      subtitle: "Los 50 mejores jugadores del mundo",
      you: "Tú",
      level: "Nivel",
      loading: "Cargando ranking..."
    },
    profile: {
      loading: "Cargando perfil...",
      notFound: "Usuario no encontrado",
      backBtn: "← Volver al Dashboard",
      level: "Nivel",
      days: "días",
      statsTitle: "Estadísticas Relevantes",
      bestMode: "Modo de Juego Estrella",
      noData: "Aún no hay datos",
      modeFlag: "Modo Banderas",
      modeSpatial: "Modo Mapa Espacial",
      bestContinent: "Mejor Continente",
      masteredCount: "Banderas Dominadas",
      worstFlags: "Banderas Más Resistidas",
      worstFlagsDesc: "Las banderas que más le cuestan a este jugador",
      noWeaknesses: "¡Aún no tiene debilidades!",
      fails: "fallos"
    },
    quiz: {
      spatialQ: "¿Qué país está marcado en el mapa?",
      flagQ: "¿A qué país pertenece esta bandera?",
      correct: "¡Correcto!",
      incorrect: "¡Incorrecto!",
      capital: "Capital:",
      continent: "Continente:",
      continueBtn: "Continuar"
    },
    summary: {
      title: "¡Sesión Completada!",
      subtitle: "Has hecho un gran trabajo.",
      correct: "Respuestas correctas",
      incorrect: "Respuestas incorrectas",
      accuracy: "Precisión",
      xpGained: "XP Obtenido",
      continueBtn: "Continuar",
      loading: "Cargando..."
    },
    map: {
      title: "Tu Progreso en el Mundo",
      notLearned: "No aprendido",
      learning: "Aprendiendo",
      familiar: "Familiar",
      mastered: "Dominado",
      backBtn: "Volver",
      loading: "Cargando Mapa...",
      accuracy: "Precisión"
    },
    landing: {
      title: "Aprende las banderas del mundo",
      subtitle: "Memoriza las banderas de todos los países de forma divertida y eficiente con nuestro sistema de repetición espaciada.",
      cta: "Comenzar ahora",
      login: "Ya tengo una cuenta"
    },
    auth: {
      loginTitle: "Iniciar Sesión",
      registerTitle: "Crear Cuenta",
      loginSubtitle: "Inicia sesión para continuar aprendiendo",
      registerSubtitle: "Crea tu cuenta y empieza tu viaje",
      email: "Correo electrónico",
      password: "Contraseña",
      name: "Nombre (opcional)",
      submitLogin: "Entrar",
      submitRegister: "Registrarse",
      loading: "Cargando...",
      error: "Credenciales incorrectas",
      errorGeneric: "Ha ocurrido un error inesperado",
      noAccount: "¿No tienes cuenta?",
      hasAccount: "¿Ya tienes cuenta?",
      toRegister: "Regístrate aquí",
      toLogin: "Inicia sesión"
    }
  },
  en: {
    dashboard: {
      title: "Hello",
      level: "Level",
      globalProgress: "Global Progress",
      mastered: "Mastered",
      learning: "Learning",
      startSession: "Start Session",
      modes: {
        world: { title: "The Whole World", desc: "Mix flags from all continents." },
        continents: { title: "By Continent", desc: "Focus on a specific region." },
        weaknesses: { title: "Review Mistakes", desc: "Practice the flags you struggle with." },
        spatial: { title: "Spatial Map", desc: "Guess which country is highlighted on the globe." },
        global: { title: "Your Global Map", desc: "Visualize your progress in the world." }
      },
      tabs: {
        progress: "My Progress",
        ranking: "Global Ranking"
      },
      logout: "Log out"
    },
    leaderboard: {
      title: "Global Ranking",
      subtitle: "Top 50 players in the world",
      you: "You",
      level: "Level",
      loading: "Loading ranking..."
    },
    profile: {
      loading: "Loading profile...",
      notFound: "User not found",
      backBtn: "← Back to Dashboard",
      level: "Level",
      days: "days",
      statsTitle: "Relevant Statistics",
      bestMode: "Star Game Mode",
      noData: "Not enough data",
      modeFlag: "Flags Mode",
      modeSpatial: "Spatial Map Mode",
      bestContinent: "Best Continent",
      masteredCount: "Flags Mastered",
      worstFlags: "Toughest Flags",
      worstFlagsDesc: "Flags this player struggles with the most",
      noWeaknesses: "No weaknesses found yet!",
      fails: "fails"
    },
    quiz: {
      spatialQ: "Which country is marked on the map?",
      flagQ: "Which country does this flag belong to?",
      correct: "Correct!",
      incorrect: "Incorrect!",
      capital: "Capital:",
      continent: "Continent:",
      continueBtn: "Continue"
    },
    summary: {
      title: "Session Completed!",
      subtitle: "You did a great job.",
      correct: "Correct answers",
      incorrect: "Incorrect answers",
      accuracy: "Accuracy",
      xpGained: "XP Gained",
      continueBtn: "Continue",
      loading: "Loading..."
    },
    map: {
      title: "Your Progress in the World",
      notLearned: "Not learned",
      learning: "Learning",
      familiar: "Familiar",
      mastered: "Mastered",
      backBtn: "Back",
      loading: "Loading Map...",
      accuracy: "Accuracy"
    },
    landing: {
      title: "Learn the flags of the world",
      subtitle: "Memorize the flags of all countries in a fun and efficient way with our spaced repetition system.",
      cta: "Start now",
      login: "I already have an account"
    },
    auth: {
      loginTitle: "Log In",
      registerTitle: "Create Account",
      loginSubtitle: "Log in to continue learning",
      registerSubtitle: "Create your account and start your journey",
      email: "Email address",
      password: "Password",
      name: "Name (optional)",
      submitLogin: "Log in",
      submitRegister: "Sign up",
      loading: "Loading...",
      error: "Invalid credentials",
      errorGeneric: "An unexpected error occurred",
      noAccount: "Don't have an account?",
      hasAccount: "Already have an account?",
      toRegister: "Sign up here",
      toLogin: "Log in"
    }
  }
};
