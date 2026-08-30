/* UI chrome follows the language of the course being read. */
const STRINGS = {
  en: {
    library: 'Educarlos', librarySub: 'To teach them, one screen at a time.',
    home: 'Educarlos', sections: 'Sections', swipe: 'Swipe up',
    courses: 'courses', courseOne: 'course',
    search: 'Search courses and lessons', noResults: 'Nothing matches that.',
    chapter: 'Chapter', lessons: 'lessons', lessonOne: 'lesson',
    reveal: 'Tap to reveal', sources: 'Sources',
    complete: 'Lesson complete', courseComplete: 'Course complete',
    nextLesson: 'Next lesson', backToMap: 'Back to the course', backToLibrary: 'All courses',
    scroll: 'Scroll', resume: 'Resume', start: 'Start',
    of: 'of', notFound: 'Not found.', loading: 'Loading…',
    reviewed: 'Reviewed', planned: 'Coming soon'
  },
  es: {
    library: 'Educarlos', librarySub: 'Enseñarlos, una pantalla cada vez.',
    home: 'Educarlos', sections: 'Secciones', swipe: 'Desliza',
    courses: 'cursos', courseOne: 'curso',
    search: 'Busca cursos y lecciones', noResults: 'No hay nada que coincida.',
    chapter: 'Capítulo', lessons: 'lecciones', lessonOne: 'lección',
    reveal: 'Toca para ver la respuesta', sources: 'Fuentes',
    complete: 'Lección completada', courseComplete: 'Curso completado',
    nextLesson: 'Siguiente lección', backToMap: 'Volver al curso', backToLibrary: 'Todos los cursos',
    scroll: 'Desliza', resume: 'Continuar', start: 'Empezar',
    of: 'de', notFound: 'No encontrado.', loading: 'Cargando…',
    reviewed: 'Revisado', planned: 'Próximamente'
  }
};

export function t(lang) {
  const dict = STRINGS[lang] || STRINGS.en;
  return (k) => (k in dict ? dict[k] : (STRINGS.en[k] ?? k));
}
