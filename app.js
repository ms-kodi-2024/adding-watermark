const Jimp = require('jimp');
const inquirer = require('inquirer');
const fs = require('fs');

const addTextWatermarkToImage = async function (inputFile, outputFile, text) {
	try {
		const image = await Jimp.read(inputFile);
		const font = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);
		const textData = {
			text,
			alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
			alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE,
		};
		image.print(font, 0, 0, textData, image.getWidth(), image.getHeight());
		await image.quality(100).writeAsync(outputFile);
		console.log('Success!');
	}
	catch(error){}
};

const addImageWatermarkToImage = async function (inputFile, outputFile, watermarkFile) {
	try {
		const image = await Jimp.read(inputFile);
		const watermark = await Jimp.read(watermarkFile);
		const x = image.getWidth() / 2 - watermark.getWidth() / 2;
		const y = image.getHeight() / 2 - watermark.getHeight() / 2;
		
		image.composite(watermark, x, y, {
			mode: Jimp.BLEND_SOURCE_OVER,
			opacitySource: 0.5,
		});
		
		await image.quality(100).writeAsync(outputFile);
		console.log('Success!');
	}
	catch(error){}
};

const applyEffects = async (image, effects) => {
  if (effects.includes('brightness')) image.brightness(0.2);
  if (effects.includes('contrast')) image.contrast(0.3);
  if (effects.includes('greyscale')) image.greyscale();
  if (effects.includes('invert')) image.invert();
  return image;
};

const prepareOutputFilename = function (fileName) {
	const fileNamesElements = fileName.split('.');
	return `${fileNamesElements[0]}-with-watermark.${fileNamesElements[1]}`;
}

const startApp = async () => {

  const answer = await inquirer.prompt([{
      name: 'start',
      message: 'Hi! Welcome to "Watermark manager". Copy your image files to `/img` folder. Then you\'ll be able to use them in the app. Are you ready?',
      type: 'confirm'
    }]);

  if(!answer.start) process.exit();

  const options = await inquirer.prompt([{
    name: 'inputImage',
    type: 'input',
    message: 'What file do you want to mark?',
    default: 'test.jpg',
	}, {
		name: 'editAnswer',
		message: 'Would you like to edit the graphic further?',
		type: 'confirm',
	}, {
    name: 'watermarkType',
    type: 'list',
    choices: ['Text watermark', 'Image watermark'],
		}]);
	
	if (options.editAnswer) {
		const editChoices = await inquirer.prompt([{
			name: 'selectedOptions',
			type: 'checkbox',
			message: 'Select your options:',
			choices: [
				'brightness',
				'contrast',
				'greyscale',
				'invert'
			]
		}]);
		options.selectedOptions = editChoices.selectedOptions;
	}
	
	if(options.watermarkType === 'Text watermark') {
		const text = await inquirer.prompt([{
			name: 'value',
			type: 'input',
			message: 'Type your watermark text:',
		}]);
		options.watermarkText = text.value;
	
		if (fs.existsSync('./img/' + options.inputImage)) {
			await addTextWatermarkToImage('./img/' + options.inputImage, './' + prepareOutputFilename(options.inputImage), options.watermarkText);
			
			if(options.editAnswer && options.selectedOptions) {
				const outputFile = './' + prepareOutputFilename(options.inputImage);
				let image = await Jimp.read(outputFile);
				image = await applyEffects(image, options.selectedOptions);
				await image.quality(100).writeAsync(outputFile);
				console.log('Additional effects applied successfully!');
			}
		} else {
      console.log('Something went wrong... Try again');
    }
	} else {
		const imagePrompt = await inquirer.prompt([{
			name: 'filename',
			type: 'input',
			message: 'Type your watermark name:',
			default: 'logo.png',
		}]);
		options.watermarkImage = imagePrompt.filename;

		if (fs.existsSync('./img/' + options.inputImage) && fs.existsSync('./img/' + options.watermarkImage)) {
			await addImageWatermarkToImage('./img/' + options.inputImage, './' + prepareOutputFilename(options.inputImage), './img/' + options.watermarkImage);
			
			if(options.editAnswer && options.selectedOptions) {
				const outputFile = './' + prepareOutputFilename(options.inputImage);
				let image = await Jimp.read(outputFile);
				image = await applyEffects(image, options.selectedOptions);
				await image.quality(100).writeAsync(outputFile);
				console.log('Additional effects applied successfully!');
			}
		} else {
      console.log('Something went wrong... Try again');
    }
	}

  startApp();
}

startApp();
