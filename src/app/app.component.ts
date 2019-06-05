import { Component, OnInit } from '@angular/core';
import { cs2ts, getConfiguration } from '../util/parser/extension';
import * as jsbeautify from 'js-beautify';
import { MethodType } from '../models/MethodType';
import { initialCode, methodStyle } from '../models/inital.data';
import { ConversionLanguage } from 'src/models/ConversionLanguage';
import { CSHARPTOTYPESCRIPT, CSHARPTOJSON } from 'src/models/conversion.model';
import { ConversionBackendService } from './conversion-backend.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  // initialize the varibale
  output;
  isCSharptoJson = false;
  isCsharptoTypescript = true;
  conversionLanguage = CSHARPTOTYPESCRIPT;
  theme = 'vs-dark';
  preserveModifier = false;
  methodType: 'signature' | 'lambda' | 'controller' = 'signature';
  changeToInterface = false;

  /**
   * setting for editor like theme and language support
   * for output side
   */
  optionInput = {
    theme: this.theme,
    format: true,
    language: 'csharp'
  };

  /**
   *    setting for editor like theme and language support
   *     for input side
   */
  optionOutput = {
    theme: this.theme,
    format: true,
    language: 'typescript'
  };

  // inital configuration for output type
  configuration = getConfiguration(
    this.preserveModifier,
    this.methodType,
    this.changeToInterface
  );

  inputCode = initialCode;
  methods: MethodType[] = methodStyle;
  conversion: MethodType[] = ConversionLanguage;

  /**
   * constructor to inject and initialize the dependency
   */
  constructor(private serviceConversion: ConversionBackendService) { }

  /**
   * show the output for the first time
   * on left editor
   */
  ngOnInit() {
    this.onChange(initialCode);
    // this.onChange(this.inputCode);
  }

  /**
   * whenever change happen
   * input will parse and produce output
   * and show in right editor
   * @param event
   */
  onChange(value) {
    // this.output = jsbeautify
    //   .js(cs2ts(event.trim(), this.configuration), "UTF-8")
    //   .trim();
    this.onConversionLanguage(this.conversionLanguage, value);
  }

  /**
   * for toggling the theme of editor
   * only two option: vs-dark and vs-light
   */
  onChangeTheme() {
    this.theme = this.theme === 'vs-dark' ? 'vs-light' : 'vs-dark';
    this.optionInput = {
      theme: this.theme,
      format: true,
      language: 'csharp'
    };
    this.optionOutput = {
      theme: this.theme,
      format: true,
      language: 'typescript'
    };
  }

  /**
   * changing the modifier preserve
   * @param event boolean
   */
  onPreserveAcessifier(event) {
    this.preserveModifier = !this.preserveModifier;
    this.configuration = getConfiguration(
      this.preserveModifier,
      this.methodType,
      this.changeToInterface
    );
    this.onChange(this.inputCode);
  }

  /**
   * changing the class to interface
   * @param event boolean
   */
  onChangeToInterface(event) {
    this.changeToInterface = !this.changeToInterface;
    this.configuration = getConfiguration(
      this.preserveModifier,
      this.methodType,
      this.changeToInterface
    );
    this.onChange(this.inputCode);
  }

  /**
   * select for method signature
   * @param event
   * @param type
   */
  onMethodType(type) {
    this.methodType = type;
    this.configuration = getConfiguration(
      this.preserveModifier,
      this.methodType,
      this.changeToInterface
    );
    this.onChange(this.inputCode);
  }

  /**
   * formatting the input code when user click on format button
   * we are using jsbeautify npm package to format the code.
   * */
  onFormat() {
    this.inputCode = jsbeautify.js(this.inputCode, 'UTF-8');
  }
  /**
   * conversion of different language like
   * c# to json
   * c# to typescript
   * @param value
   */
  async onConversionLanguage(conversionType, value?: string) {
    console.log(value);
    this.conversionLanguage = conversionType;
    switch (conversionType) {
      case CSHARPTOJSON:
        this.isCsharptoTypescript = false;
        this.isCSharptoJson = true;
        console.log(conversionType);
        this.inputCode = value ? value : this.inputCode;
        if (
          this.inputCode == undefined ||
          this.inputCode === null ||
          this.inputCode == ''
        ) {
          this.output = '';
          return;
        }
        this.output = 'Converting to JSON ....';

        await this.serviceConversion
          .conversionToCSharptoJson(this.inputCode)

          .subscribe(
            response => {
              console.log(JSON.stringify(response));
              this.output = jsbeautify(JSON.stringify(response));
            },
            error => {
              this.output = `Unable to convert the C# to json. Please use valid C# code.`;
            }
          );
        break;
      default:
        this.isCsharptoTypescript = true;
        this.isCSharptoJson = false;
        this.inputCode = value ? value : initialCode;
        this.output = jsbeautify
          .js(cs2ts(this.inputCode.trim(), this.configuration), 'UTF-8')
          .trim();
        console.log(conversionType);
    }
  }
}
