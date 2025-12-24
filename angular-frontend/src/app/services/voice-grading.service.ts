import { Injectable, NgZone } from '@angular/core';
import { Subject } from 'rxjs';
import { LanguageService, LanguageCode } from './language.service';

declare var webkitSpeechRecognition: any;
declare var SpeechRecognition: any;

@Injectable({
  providedIn: 'root'
})
export class VoiceGradingService {
  private recognition: any;
  private isListening = false;
  public transcript$ = new Subject<string>();
  public error$ = new Subject<string>();
  public listening$ = new Subject<boolean>();
  private currentLang: string = 'ar-SA';

  private langMap: Record<LanguageCode, string> = {
    'AR': 'ar-SA',
    'FR': 'fr-FR',
    'EN': 'en-US',
    'ES': 'es-ES',
    'IT': 'it-IT',
    'DE': 'de-DE',
    'TR': 'tr-TR'
  };

  constructor(private ngZone: NgZone, private languageService: LanguageService) {
    this.initRecognition();
    
    // Subscribe to language changes
    this.languageService.currentLanguage$.subscribe(lang => {
      this.setLanguage(lang);
    });
  }

  private setLanguage(langCode: LanguageCode) {
    this.currentLang = this.langMap[langCode] || 'ar-SA';
    if (this.recognition) {
      this.recognition.lang = this.currentLang;
    }
    // If currently listening, we might need to restart to apply language change?
    // Usually changing the property on the fly works between sessions or segments, 
    // but safe to restart if running.
    if (this.isListening) {
      this.stop();
      setTimeout(() => this.start(), 100);
    }
  }

  private initRecognition() {
    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = false;
        this.recognition.lang = this.currentLang;

        this.recognition.onresult = (event: any) => {
          this.ngZone.run(() => {
            const lastResultIndex = event.results.length - 1;
            const transcript = event.results[lastResultIndex][0].transcript.trim();
            this.transcript$.next(transcript);
          });
        };

        this.recognition.onerror = (event: any) => {
          this.ngZone.run(() => {
            this.error$.next(event.error);
            if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
              this.stop();
            }
          });
        };

        this.recognition.onend = () => {
          this.ngZone.run(() => {
            if (this.isListening) {
              // Restart if it stopped unexpectedly but we still want to listen
               try {
                  this.recognition.start();
               } catch(e) {
                 this.isListening = false;
                 this.listening$.next(false);
               }
            } else {
               this.listening$.next(false);
            }
          });
        };
      } else {
        console.error('Speech Recognition API not supported in this browser.');
        this.error$.next('browser_not_supported');
      }
    } catch (e) {
      console.error('Error initializing speech recognition:', e);
    }
  }

  start() {
    if (this.recognition && !this.isListening) {
      try {
        this.recognition.start();
        this.isListening = true;
        this.listening$.next(true);
      } catch (e) {
        console.error('Failed to start recognition:', e);
      }
    }
  }

  stop() {
    if (this.recognition && this.isListening) {
      this.isListening = false;
      this.listening$.next(false);
      try {
        this.recognition.stop();
      } catch (e) {
         console.error('Failed to stop recognition:', e);
      }
    }
  }

  toggle() {
    if (this.isListening) {
      this.stop();
    } else {
      this.start();
    }
  }

  isActive(): boolean {
    return this.isListening;
  }
}

