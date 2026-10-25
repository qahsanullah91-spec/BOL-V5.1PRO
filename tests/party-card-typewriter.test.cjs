const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

test('Black Typewriter Typography for Exporter, Consignee, and Notify Party Suite', async (t) => {
  const previewPath = path.join(__dirname, '..', 'components', 'bill-of-lading', 'a4-preview.tsx');
  const cssPath = path.join(__dirname, '..', 'app', 'globals.css');
  const previewCode = fs.readFileSync(previewPath, 'utf8');
  const cssCode = fs.readFileSync(cssPath, 'utf8');

  await t.test('1. Courier New font stack and solid black color #000000 are defined in CSS for business information', () => {
    assert.match(
      cssCode,
      /font-family:\s*"Courier New",\s*Courier,\s*monospace\s*!important;[\s\S]*?color:\s*#000000\s*!important;/,
      'Must enforce "Courier New", Courier, monospace font stack and #000000 solid black color'
    );
    assert.match(
      cssCode,
      /\.business-information[\s\S]*?\.exporter-details[\s\S]*?\.consignee-details[\s\S]*?\.notify-party-details/,
      'Must apply typewriter typography to business-information, exporter-details, consignee-details, and notify-party-details classes'
    );
  });

  await t.test('2. Company names strictly enforce font-weight: 700, Courier New, and solid black color', () => {
    assert.match(
      cssCode,
      /\.company-name[\s\S]*?font-weight:\s*700\s*!important;[\s\S]*?color:\s*#000000\s*!important;/,
      'Company names must have font-weight: 700 and #000000'
    );
    assert.match(
      previewCode,
      /formData\.shipper_name[\s\S]*?party-card-name\s+company-name/,
      'Exporter company name in preview must use party-card-name company-name'
    );
    assert.match(
      previewCode,
      /formData\.notify_party[\s\S]*?party-card-name\s+company-name/,
      'Notify party company name in preview must use party-card-name company-name'
    );
    assert.match(
      previewCode,
      /name=\{name\}|value=\{name\}[\s\S]*?party-card-name\s+company-name/,
      'Consignee company name in preview must use party-card-name company-name'
    );
  });

  await t.test('3. Addresses strictly enforce font-weight: 600, Courier New, and solid black color', () => {
    assert.match(
      cssCode,
      /\.business-address[\s\S]*?font-weight:\s*600\s*!important;[\s\S]*?color:\s*#000000\s*!important;/,
      'Business addresses must have font-weight: 600 and #000000'
    );
    assert.match(
      previewCode,
      /formData\.shipper_address[\s\S]*?party-card-address\s+business-address/,
      'Exporter address in preview must use party-card-address business-address'
    );
    assert.match(
      previewCode,
      /formData\.notify_party_address[\s\S]*?party-card-address\s+business-address/,
      'Notify party address in preview must use party-card-address business-address'
    );
    assert.match(
      previewCode,
      /value=\{address\}[\s\S]*?party-card-address\s+business-address/,
      'Consignee address in preview must use party-card-address business-address'
    );
  });

  await t.test('4. Registration details (GST, IEC, FSSAI, PAN) enforce font-weight: 600 and solid black color', () => {
    assert.match(
      cssCode,
      /\.registration-details[\s\S]*?font-weight:\s*600\s*!important;[\s\S]*?color:\s*#000000\s*!important;/,
      'Registration details must have font-weight: 600 and #000000'
    );
    assert.match(
      previewCode,
      /isRegistrationLine[\s\S]*?registration-details\s+party-card-registration/,
      'preview renderLineContent must detect registration lines and apply registration-details'
    );
  });

  await t.test('5. Telephone numbers and emails strictly enforce font-weight: 700 and solid black color', () => {
    assert.match(
      cssCode,
      /\.party-card-phone[\s\S]*?font-weight:\s*700\s*!important;[\s\S]*?color:\s*#000000\s*!important;/,
      'Contact phone must have font-weight: 700 and #000000'
    );
    assert.match(
      cssCode,
      /\.party-card-email[\s\S]*?font-weight:\s*700\s*!important;[\s\S]*?color:\s*#000000\s*!important;/,
      'Contact email must have font-weight: 700 and #000000'
    );
    assert.match(
      previewCode,
      /isPureNumericPhone[\s\S]*?party-card-phone\s+contact-details[\s\S]*?fontWeight:\s*700/,
      'Pure numeric phones in preview must render with font-weight: 700 and Courier New'
    );
    assert.match(
      previewCode,
      /isPureEmail[\s\S]*?party-card-email\s+contact-details[\s\S]*?fontWeight:\s*700/,
      'Pure email addresses in preview must render with font-weight: 700 and Courier New'
    );
  });

  await t.test('6. Section headings preserve bold modern sans-serif navy typography', () => {
    assert.match(
      cssCode,
      /\.party-card-title\s*\{[\s\S]*?font-family:\s*ui-sans-serif[\s\S]*?color:\s*#0f172a/,
      'Section headings must preserve modern sans-serif and dark navy #0f172a color'
    );
    assert.match(
      previewCode,
      /<h4[^>]*className=\{`party-card-title[^`]*`\}[^>]*>\s*Exporter Info\s*<\/h4>/,
      'Exporter Info heading must be preserved'
    );
    assert.match(
      previewCode,
      /<h4[^>]*className=\{`party-card-title[^`]*`\}[^>]*>\s*Notify Party\s*<\/h4>/,
      'Notify Party heading must be preserved'
    );
  });

  await t.test('7. Persian text and labels are isolated and preserve Vazirmatn RTL typography', () => {
    assert.match(
      cssCode,
      /\.party-card-body\s+\.persian-text[\s\S]*?font-family:\s*var\(--font-vazirmatn[\s\S]*?direction:\s*rtl\s*!important;/,
      'Persian text inside party-card must be preserved with Vazirmatn and dir: rtl'
    );
    assert.match(
      cssCode,
      /\.party-card-subtitle[\s\S]*?color:\s*#2563eb[\s\S]*?direction:\s*rtl/,
      'Persian subtitle labels must preserve #2563eb blue color and direction: rtl'
    );
    assert.match(
      previewCode,
      /isPersian\s*\?[\s\S]*?persian-text\s+bol-persian-text\s+font-\[vazirmatn\]/,
      'Persian lines in preview must retain Vazirmatn and not use Courier New'
    );
  });

  await t.test('8. Print and PDF export rules enforce black typewriter typography in A4 output', () => {
    assert.match(
      cssCode,
      /\[data-bol-a4="true"\]\s+\.party-card-name[\s\S]*?font-family:\s*"Courier New",\s*Courier,\s*monospace\s*!important;[\s\S]*?color:\s*#000000\s*!important;/,
      'Print/PDF party-card-name must enforce Courier New and #000000'
    );
    assert.match(
      cssCode,
      /\[data-bol-a4="true"\]\s+\.party-card-info-text[\s\S]*?font-family:\s*"Courier New",\s*Courier,\s*monospace\s*!important;[\s\S]*?color:\s*#000000\s*!important;/,
      'Print/PDF party-card-info-text must enforce Courier New and #000000'
    );
  });

  await t.test('9. Visual design elements are intact (icons, port background, light-blue borders)', () => {
    assert.match(
      cssCode,
      /\.party-card-glass\s*\{[\s\S]*?border-color:\s*#93c5fd;[\s\S]*?backdrop-filter:\s*blur/,
      'Translucent glass card styling with port background blur must be preserved'
    );
    assert.match(
      previewCode,
      /<Building2[^>]*\/>[\s\S]*?<MapPin[^>]*\/>[\s\S]*?<Phone[^>]*\/>[\s\S]*?<Mail[^>]*\/>/,
      'All blue Lucide icons (Building2, MapPin, Phone, Mail) must remain present and functional'
    );
  });
});
