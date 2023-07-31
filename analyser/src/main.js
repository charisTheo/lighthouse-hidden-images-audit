import './styles.css';
import {analyse} from './analyser.js';

const onClickListener = (event) => {
  const button = event.target;
  button.disabled = true;
  const results = analyse();

  if (results?.images?.length > 0) {
    const resultsElement = document.querySelector('.results');
    resultsElement.innerHTML = '<h3>Look what I found:</h3>';
    results.images.forEach((i) => {
      const image = new Image(i.width || 'auto');
      image.src = i.currentSrc;
      resultsElement.append(image);
      return image;
    });
  }

  button.disabled = false;
};

window.addEventListener('load', () => {
  const analyseButton = document.querySelector('.analyse-btn');
  analyseButton.addEventListener('click', onClickListener);
});
