# Logo Images

## How to add your logo:

1. Place your logo image file in this directory (`src/assets/images/`)
   - Supported formats: `.png`, `.svg`, `.jpg`, `.jpeg`
   - Recommended size: 200x200px or larger (will be scaled down)
   - Recommended name: `logo.png` or `logo.svg`

2. Update `login.component.html`:
   - Uncomment the "Option 1: Logo with Image" section
   - Comment out the "Option 2: Icon Logo with Text" section
   - Update the image path if your logo has a different name

3. Example:
   ```html
   <img 
     src="assets/images/logo.png" 
     alt="Maestro Logo" 
     class="h-16 w-auto object-contain"
   />
   ```

## Current Setup:

The login page currently uses an icon-based logo (letter "M" in a blue rounded square) with the text "المايسترو" next to it.

