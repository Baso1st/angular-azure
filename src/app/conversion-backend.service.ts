import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ConversionBackendService {

  url = environment.apiURL + 'CSharpToJson';

  constructor(private http: HttpClient) { }

  conversionToCSharptoJson(valueString) {
    console.log(valueString);

    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json; charset=utf-8'
      })
    };
    return this.http.post(
      this.url,
      JSON.stringify(valueString),
      httpOptions
    );
  }
}
