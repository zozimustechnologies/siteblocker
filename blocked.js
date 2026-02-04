// Blocked page script - handles go back button and lick mark animations

document.addEventListener('DOMContentLoaded', () => {
  // Attach click handler to go back button
  const goBackBtn = document.getElementById('goBackBtn');
  if (goBackBtn) {
    goBackBtn.addEventListener('click', goBack);
  }

  // Create random lick marks animation
  const lickMarks = document.querySelector('.lick-marks');
  if (lickMarks) {
    setInterval(() => {
      const mark = document.createElement('div');
      mark.className = 'lick-mark';
      mark.style.top = Math.random() * 60 + 10 + '%';
      mark.style.left = Math.random() * 70 + 15 + '%';
      mark.style.animation = 'fadeInOut 2s ease-in-out forwards';
      lickMarks.appendChild(mark);
      
      setTimeout(() => mark.remove(), 2000);
    }, 1500);
  }
});

function goBack() {
  if (window.history.length > 1) {
    window.history.back();
  } else {
    window.location.href = 'about:blank';
  }
}
