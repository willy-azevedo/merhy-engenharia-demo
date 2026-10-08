document.documentElement.classList.add('js');

const projects = {
  sunview: {
    name:'Sunview',city:'Ponta Grossa',district:'Vila Estrela',
    tagline:'Amplitude para viver cada momento.',area:'189 m²',areaLabel:'de área útil',rooms:'3 suítes',extra:'2 vagas de garagem',
    hero:'assets/sunview-varanda.webp',heroAlt:'Sala-varanda integrada do Sunview',caption:'Sala-varanda · Sunview',
    heroPhotos:[['assets/sunview-varanda.webp','Sala-varanda integrada do Sunview'],['assets/sunview-living.webp','Living integrado do Sunview'],['assets/sunview-piscina.webp','Piscina e espaços de convivência do Sunview']],
    facade:'assets/sunview-fachada.webp',
    intro:'Amplitude, integração e uma nova relação com os espaços. A sala-varanda de 39 m² conecta a vida dentro de casa à paisagem, em um projeto residencial na Vila Estrela.',
    address:'Rua Afonso Pena, 293, esquina com Rua Nilo Peçanha · Ponta Grossa',
    detail:'Apartamentos com três suítes, duas vagas destrancadas e 189 m² de área útil. Nas áreas comuns, piscina aquecida, deck, espaço gourmet e academia para diferentes momentos da rotina.',
    gallery:[['assets/sunview-varanda.webp','Sala-varanda de 39 m²'],['assets/sunview-piscina.webp','Piscina e convivência'],['assets/sunview-living.webp','Ambientes integrados']]
  },
  'santa-helena': {
    name:'Santa Helena',city:'Guaratuba',district:'Praia Central',
    tagline:'Mais espaço para viver o litoral.',area:'117 e 135 m²',areaLabel:'privativos',rooms:'Até 3 suítes',extra:'conforme a tipologia',
    hero:'assets/santa-helena-living.webp',heroAlt:'Living integrado do Santa Helena',caption:'Living integrado · Santa Helena',
    heroPhotos:[['assets/santa-helena-living.webp','Living integrado do Santa Helena'],['assets/santa-helena-piscina.webp','Piscina e áreas externas do Santa Helena']],
    facade:'assets/santa-helena-fachada.webp',
    intro:'Um projeto na Praia Central de Guaratuba, com espaços de convívio que conectam living, cozinha e varanda. Uma nova possibilidade para viver o litoral.',
    address:'Rua Padre Bento, 482 · Praia Central · Guaratuba',
    detail:'Duas tipologias: 117 m² privativos com uma suíte e dois dormitórios, ou 135 m² privativos com três suítes. Piscina aquecida, salão de festas e academia fazem parte das áreas comuns.',
    gallery:[['assets/santa-helena-living.webp','Living integrado · tipologia de 135 m²'],['assets/santa-helena-piscina.webp','Piscina e áreas externas']]
  }
};
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const header = document.getElementById('site-header');
const menuButton = document.querySelector('.menu-toggle');
const mobileNav = document.getElementById('mobile-nav');
const hero = document.querySelector('.hero');
const heroImage = document.getElementById('hero-image');
const heroContent = document.getElementById('hero-content');
const whatsappFloating = document.querySelector('.whatsapp-floating');
const slideKeys = Object.keys(projects);
const heroIndicators=[...document.querySelectorAll('[data-hero-slide]')];
let activeSlide=0,activePhoto=0,heroVisible=true,frame=null,started=performance.now(),elapsed=0;
const imageDuration=6000;

function updateHeader(){
  header.classList.toggle('scrolled',window.scrollY>56);
  const height=header.offsetHeight;
  whatsappFloating.classList.toggle('is-visible',hero.getBoundingClientRect().bottom<=height);
  const stage=livingStage.getBoundingClientRect();
  const immersive=innerWidth>600&&!reducedMotion.matches&&stage.top<=0&&stage.bottom>height;
  const image=livingCenter.getBoundingClientRect();
  const overPhoto=immersive&&image.top<=height/2&&image.bottom>height/2&&image.width>innerWidth*.8;
  header.classList.toggle('immersive',immersive);
  header.classList.toggle('over-photo',overPhoto);
}
function setMenu(open){
  mobileNav.hidden=!open;menuButton.setAttribute('aria-expanded',String(open));
  menuButton.setAttribute('aria-label',open?'Fechar menu':'Abrir menu');header.classList.toggle('menu-open',open);
}
menuButton.addEventListener('click',()=>setMenu(mobileNav.hidden));
mobileNav.querySelectorAll('button').forEach(link=>link.addEventListener('click',()=>setMenu(false)));
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!mobileNav.hidden){setMenu(false);menuButton.focus();}});

function shouldRun(){return heroVisible&&!document.hidden&&!reducedMotion.matches&&!document.body.classList.contains('review-picking')&&!document.body.classList.contains('review-drafting')&&!document.body.classList.contains('review-focusing');}
function progressFrame(now){
  frame=null;
  if(!shouldRun())return;
  const duration=projects[slideKeys[activeSlide]].heroPhotos.length*imageDuration;
  elapsed=Math.max(0,Math.min(duration,now-started));
  document.querySelector(`[data-slide="${activeSlide}"] .slide-progress`).style.transform=`scaleX(${elapsed/duration})`;
  heroIndicators[activeSlide].querySelector('.hero-indicator-progress').style.transform=`scaleY(${elapsed/duration})`;
  if(elapsed>=duration){showSlide(activeSlide+1);return;}
  const photo=Math.floor(elapsed/imageDuration);
  if(photo!==activePhoto)showHeroPhoto(photo);
  frame=requestAnimationFrame(progressFrame);
}
function schedule(){
  cancelAnimationFrame(frame);frame=null;
  if(shouldRun()){started=performance.now()-elapsed;frame=requestAnimationFrame(progressFrame);}
  heroImage.style.animationPlayState=shouldRun()?'running':'paused';
}
function restartImage(){
  heroImage.classList.remove('gently-moving');
  heroImage.style.animationDuration=`${imageDuration}ms`;
  if(!reducedMotion.matches){void heroImage.offsetWidth;heroImage.classList.add('gently-moving');}
}
function showHeroPhoto(index){
  activePhoto=index;
  const [source,description]=projects[slideKeys[activeSlide]].heroPhotos[index];
  const backdrop=document.getElementById('hero-backdrop');
  backdrop.getAnimations().forEach(animation=>animation.cancel());
  backdrop.src=heroImage.src;
  backdrop.style.opacity=reducedMotion.matches?'0':'1';
  const fadeBackdrop=()=>{
    if(heroImage.getAttribute('src')!==source)return;
    if(!reducedMotion.matches)backdrop.animate([{opacity:1},{opacity:0}],{duration:1000,easing:'cubic-bezier(.2,.7,.2,1)'});
    backdrop.style.opacity='0';
  };
  heroImage.onload=fadeBackdrop;
  heroImage.src=source;heroImage.alt=description;
  if(heroImage.complete)fadeBackdrop();
  restartImage();
  heroImage.style.animationPlayState=shouldRun()?'running':'paused';
}
function showSlide(next){
  activeSlide=(next+slideKeys.length)%slideKeys.length;const key=slideKeys[activeSlide],project=projects[key];
  showHeroPhoto(0);
  const text={ 'hero-title':project.name,'hero-city':`${project.district} · ${project.city}`,'hero-tagline':project.tagline,'hero-area':project.area,'hero-area-label':project.areaLabel,'hero-rooms':project.rooms,'hero-extra':project.extra,'hero-cta-label':`Conheça o ${project.name}`,'slide-count':`0${activeSlide+1} / 02` };
  Object.entries(text).forEach(([id,value])=>document.getElementById(id).textContent=value);
  document.getElementById('hero-cta').dataset.project=key;
  heroContent.setAttribute('aria-label',`${activeSlide+1} de 2: ${project.name}`);
  document.querySelectorAll('[data-slide]').forEach(button=>{button.setAttribute('aria-pressed',String(Number(button.dataset.slide)===activeSlide));button.querySelector('.slide-progress').style.transform='scaleX(0)';});
  heroIndicators.forEach((button,index)=>{button.setAttribute('aria-pressed',String(index===activeSlide));button.querySelector('.hero-indicator-progress').style.transform='scaleY(0)';});
  if(!reducedMotion.matches&&!document.body.classList.contains('review-focusing'))heroContent.animate([{opacity:.35,transform:'translateX(16px)'},{opacity:1,transform:'translateX(0)'}],{duration:420,easing:'ease-out'});
  elapsed=0;schedule();
}
document.querySelectorAll('[data-slide]').forEach(button=>button.addEventListener('click',()=>showSlide(Number(button.dataset.slide))));
heroIndicators.forEach(button=>button.addEventListener('click',()=>showSlide(Number(button.dataset.heroSlide))));
document.getElementById('previous-slide').addEventListener('click',()=>showSlide(activeSlide-1));
document.getElementById('next-slide').addEventListener('click',()=>showSlide(activeSlide+1));
document.addEventListener('visibilitychange',schedule);
document.addEventListener('merhy-review-mode',schedule);
document.addEventListener('merhy-review-project',event=>{
  const index=slideKeys.indexOf(event.detail.project);
  if(index<0)return;
  showSlide(index);
  const photo=projects[slideKeys[index]].heroPhotos.findIndex(image=>image[0]===event.detail.image);
  if(photo>0){elapsed=photo*imageDuration;showHeroPhoto(photo);schedule();}
});
new IntersectionObserver(entries=>{heroVisible=entries[0].isIntersecting;schedule();},{threshold:.1}).observe(hero);

const revealObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{
  if(entry.isIntersecting){entry.target.classList.add('visible');revealObserver.unobserve(entry.target);}
}),{threshold:.08});
document.querySelectorAll('.launch-grid,.values-grid,.journal-layout').forEach(group=>{
  group.querySelectorAll('.reveal').forEach((element,index)=>element.style.setProperty('--reveal-delay',`${index*110}ms`));
});
document.querySelectorAll('.reveal').forEach(element=>revealObserver.observe(element));
const driftingImages=[...document.querySelectorAll('.launch-image,.about-image')];

const living=document.getElementById('espacos');
const livingScenes=[...document.querySelectorAll('.living-scene')];
const livingScroll=document.querySelector('.living-scroll');
const livingStage=document.querySelector('.living-stage');
const livingCenter=livingStage.querySelector('.scene-home');
const livingSequence=[livingCenter,...livingScenes.filter(scene=>scene!==livingCenter)];
const livingMedia=livingSequence.map(scene=>({src:scene.querySelector('img').getAttribute('src'),alt:scene.querySelector('img').alt,caption:scene.querySelector('figcaption').textContent}));
const livingLayers=livingMedia.map((media,index)=>{
  const image=document.createElement('img');image.src=media.src;image.alt='';image.setAttribute('aria-hidden','true');image.className='living-slide';image.style.opacity=index===0?'1':'0';
  livingCenter.querySelector('button').append(image);return image;
});
const livingDots=document.createElement('nav');livingDots.className='living-dots';livingDots.setAttribute('aria-label','Ambientes na sequência de rolagem');
livingMedia.forEach((media,index)=>{
  const dot=document.createElement('button');dot.type='button';dot.setAttribute('aria-label',`Ver ${media.caption}`);dot.addEventListener('click',()=>{
    const bounds=livingScroll.getBoundingClientRect();
    window.scrollTo({top:scrollY+bounds.top+(bounds.height-innerHeight)*(.25+index*.17),behavior:'smooth'});
  });livingDots.append(dot);
});livingStage.append(livingDots);
let livingActive=0;
function setLivingActive(index){
  livingActive=index;
  livingStage.dataset.activeImage=livingMedia[index].src;
  livingCenter.querySelector('figcaption').textContent=livingMedia[index].caption;
  livingCenter.querySelector('button').setAttribute('aria-label',livingMedia[index].caption);
  [...livingDots.children].forEach((dot,i)=>{dot.setAttribute('aria-current',i===index?'true':'false');});
}
document.addEventListener('merhy-review-living',event=>{
  const index=livingMedia.findIndex(media=>media.src===event.detail.image);
  if(index<0)return;
  if(innerWidth>600&&!reducedMotion.matches){
    const bounds=livingScroll.getBoundingClientRect();
    window.scrollTo({top:scrollY+bounds.top+(bounds.height-innerHeight)*(.28+index*.17),behavior:'instant'});
  }else{
    const image=livingScenes.flatMap(scene=>[...scene.querySelectorAll('img:not(.living-slide)')]).find(image=>image.getAttribute('src')===event.detail.image);
    if(image)window.scrollTo({top:scrollY+image.getBoundingClientRect().top-110,behavior:'instant'});
  }
  updateScroll();
});
let livingPointer=0;
let scrollFrame=null;
function updateScroll(){
  scrollFrame=null;
  if(reducedMotion.matches||innerWidth<=600){
    livingStage.classList.remove('immersed','sequencing');
    livingScenes.forEach(scene=>{scene.style.opacity='1';scene.querySelector('button').tabIndex=0;});setLivingActive(0);
    if(reducedMotion.matches){updateHeader();return;}
  }
  if(innerWidth>600){
    const bounds=livingScroll.getBoundingClientRect();
    const progress=Math.max(0,Math.min(1,-bounds.top/(bounds.height-innerHeight)));
    const expansion=Math.min(1,progress/.22);
    const fold=expansion*expansion*(3-2*expansion);
    livingStage.style.setProperty('--expand-width',`${30+70*fold}%`);
    livingStage.style.setProperty('--expand-height',`${27+73*fold}svh`);
    livingStage.style.setProperty('--expand-top',`${66*(1-fold)}%`);
    livingStage.style.setProperty('--scene-shade',Math.max(0,fold-.25)*.38);
    livingStage.classList.toggle('immersed',fold>.45);
    livingStage.classList.toggle('sequencing',expansion>=1);
    livingScenes.forEach(scene=>{
      if(scene===livingCenter)return;
      const left=scene.classList.contains('scene-pool')||scene.classList.contains('scene-coast');
      const upper=scene.classList.contains('scene-pool')||scene.classList.contains('scene-terrace');
      scene.style.setProperty('--scene-y',`${fold*innerHeight*(upper?.38:-.23)}px`);
      scene.style.setProperty('--scene-x',`${fold*innerWidth*(left?.32:-.32)+livingPointer*Number(scene.dataset.drift)*.12*(1-fold)}px`);
      scene.querySelector('button').tabIndex=fold>.9?-1:0;
    });
    const slidePosition=Math.max(0,Math.min(4,(progress-.25)/.17));
    const current=Math.floor(slidePosition),mix=Math.max(0,(slidePosition-current-.65)/.35);
    livingLayers.forEach((image,index)=>{
      image.style.opacity=index===current?'1':index===current+1?String(mix):'0';
      image.style.transform=`scale(${index===current?1+Math.min(slidePosition-current,.65)*.035:1})`;
    });
    setLivingActive(mix>.5?Math.min(4,current+1):current);
  }

  driftingImages.forEach(element=>{
    const rect=element.getBoundingClientRect();
    if(rect.bottom<0||rect.top>innerHeight)return;
    const position=(innerHeight/2-rect.top-rect.height/2)/(innerHeight+rect.height);
    element.style.setProperty('--image-drift',`${Math.max(-20,Math.min(20,position*45))}px`);
  });
  updateHeader();
}
window.addEventListener('scroll',()=>{if(!scrollFrame)scrollFrame=requestAnimationFrame(updateScroll);},{passive:true});
window.addEventListener('resize',()=>{updateScroll();if(window.innerWidth>800)setMenu(false);});
living.addEventListener('pointermove',event=>{if(event.pointerType!=='mouse'||reducedMotion.matches)return;livingPointer=(event.clientX/innerWidth-.5)*2;if(!scrollFrame)scrollFrame=requestAnimationFrame(updateScroll);});
living.addEventListener('pointerleave',()=>{livingPointer=0;if(!scrollFrame)scrollFrame=requestAnimationFrame(updateScroll);});

const countElements=[...document.querySelectorAll('[data-count]')];
const counterFrames=new Map();
function finishCounters(){countElements.forEach(element=>{cancelAnimationFrame(counterFrames.get(element));element.textContent=element.dataset.count;});counterFrames.clear();}
const countObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{
  if(!entry.isIntersecting)return;
  countObserver.unobserve(entry.target);
  if(reducedMotion.matches)return;
  countElements.forEach((element,index)=>{
    const target=Number(element.dataset.count),start=Number(element.dataset.start||0),begin=performance.now()+index*120;
    element.textContent=start;
    const tick=now=>{
      if(reducedMotion.matches){element.textContent=target;return;}
      const progress=Math.max(0,Math.min(1,(now-begin)/1800));
      element.textContent=Math.round(start+(target-start)*(1-Math.pow(1-progress,3)));
      if(progress<1)counterFrames.set(element,requestAnimationFrame(tick));else counterFrames.delete(element);
    };
    counterFrames.set(element,requestAnimationFrame(tick));
  });
}),{threshold:.5});
countObserver.observe(document.querySelector('.stats'));

const portfolioTrack=document.getElementById('portfolio-track');
function movePortfolio(direction){portfolioTrack.scrollBy({left:direction*(portfolioTrack.querySelector('article').getBoundingClientRect().width+30),behavior:reducedMotion.matches?'instant':'smooth'});}
document.getElementById('portfolio-prev').addEventListener('click',()=>movePortfolio(-1));
document.getElementById('portfolio-next').addEventListener('click',()=>movePortfolio(1));

document.getElementById('contact-form').addEventListener('submit',event=>{event.preventDefault();document.getElementById('form-feedback').textContent='Esta é uma prévia visual do formulário. Nenhuma mensagem foi enviada. Para conversar com a Merhy, use o WhatsApp ou o e-mail ao lado.';});
reducedMotion.addEventListener('change',()=>{restartImage();schedule();if(reducedMotion.matches)finishCounters();updateScroll();});
updateHeader();updateScroll();restartImage();schedule();
