/**
 * ARIA Label Patterns Examples
 *
 * Demonstrates proper ARIA labeling techniques according to WCAG 2.1:
 * - Success Criterion 4.1.2: Name, Role, Value (Level A)
 * - Success Criterion 2.4.6: Headings and Labels (Level AA)
 * - Success Criterion 3.3.2: Labels or Instructions (Level A)
 *
 * @see https://www.w3.org/WAI/WCAG21/Understanding/name-role-value
 */

/**
 * Example 1: Basic ARIA Label
 * Use aria-label for simple, non-visible labels
 */
export function createSearchButton(): HTMLButtonElement {
  const button = document.createElement('button');
  button.setAttribute('aria-label', 'Search');
  button.innerHTML = '🔍'; // Icon without text
  button.type = 'button';

  return button;
}

/**
 * Example 2: ARIA Labelledby - Single Reference
 * Use aria-labelledby to reference existing visible text
 */
export function createDialogWithTitle(): HTMLElement {
  const dialog = document.createElement('div');
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-labelledby', 'dialog-title');
  dialog.setAttribute('aria-describedby', 'dialog-description');

  const title = document.createElement('h2');
  title.id = 'dialog-title';
  title.textContent = 'Confirm Delete';

  const description = document.createElement('p');
  description.id = 'dialog-description';
  description.textContent = 'Are you sure you want to delete this item? This action cannot be undone.';

  const actions = document.createElement('div');
  actions.innerHTML = `
    <button type="button">Cancel</button>
    <button type="button" aria-label="Confirm delete">Delete</button>
  `;

  dialog.appendChild(title);
  dialog.appendChild(description);
  dialog.appendChild(actions);

  return dialog;
}

/**
 * Example 3: ARIA Labelledby - Multiple References
 * Combine multiple elements to create a comprehensive label
 */
export function createFormFieldWithContext(): HTMLElement {
  const container = document.createElement('div');
  container.innerHTML = `
    <h3 id="billing-heading">Billing Information</h3>
    <div>
      <label id="card-label" for="card-number">Card Number</label>
      <input
        type="text"
        id="card-number"
        aria-labelledby="billing-heading card-label"
        aria-describedby="card-hint"
        maxlength="16"
      />
      <div id="card-hint" class="hint">Enter your 16-digit card number</div>
    </div>
  `;

  return container;
}

/**
 * Example 4: Form Input with Label Association
 * Demonstrates proper label-input relationships
 */
export function createAccessibleFormField(
  labelText: string,
  inputId: string,
  inputType: string = 'text',
  required: boolean = false
): HTMLElement {
  const fieldset = document.createElement('div');
  fieldset.className = 'form-field';

  const label = document.createElement('label');
  label.htmlFor = inputId;
  label.textContent = labelText;

  if (required) {
    const requiredIndicator = document.createElement('span');
    requiredIndicator.setAttribute('aria-label', 'required');
    requiredIndicator.className = 'required';
    requiredIndicator.textContent = '*';
    label.appendChild(requiredIndicator);
  }

  const input = document.createElement('input');
  input.type = inputType;
  input.id = inputId;
  input.name = inputId;

  if (required) {
    input.required = true;
    input.setAttribute('aria-required', 'true');
  }

  fieldset.appendChild(label);
  fieldset.appendChild(input);

  return fieldset;
}

/**
 * Example 5: ARIA Describedby for Additional Context
 * Provide help text and error messages
 */
export function createPasswordFieldWithValidation(): HTMLElement {
  const container = document.createElement('div');

  const label = document.createElement('label');
  label.htmlFor = 'password';
  label.textContent = 'Password';

  const input = document.createElement('input');
  input.type = 'password';
  input.id = 'password';
  input.setAttribute('aria-describedby', 'password-requirements password-error');
  input.setAttribute('aria-invalid', 'false');

  const requirements = document.createElement('div');
  requirements.id = 'password-requirements';
  requirements.className = 'help-text';
  requirements.innerHTML = `
    <ul>
      <li>At least 8 characters</li>
      <li>Include uppercase and lowercase letters</li>
      <li>Include at least one number</li>
    </ul>
  `;

  const error = document.createElement('div');
  error.id = 'password-error';
  error.className = 'error-message';
  error.setAttribute('role', 'alert');
  error.setAttribute('aria-live', 'assertive');
  error.style.display = 'none';

  container.appendChild(label);
  container.appendChild(input);
  container.appendChild(requirements);
  container.appendChild(error);

  // Validation example
  input.addEventListener('blur', () => {
    const password = input.value;
    const isValid = password.length >= 8 &&
                   /[A-Z]/.test(password) &&
                   /[a-z]/.test(password) &&
                   /\d/.test(password);

    if (!isValid && password.length > 0) {
      input.setAttribute('aria-invalid', 'true');
      error.textContent = 'Password does not meet requirements';
      error.style.display = 'block';
    } else {
      input.setAttribute('aria-invalid', 'false');
      error.style.display = 'none';
    }
  });

  return container;
}

/**
 * Example 6: Icon Buttons with Labels
 * Ensure icon-only buttons are accessible
 */
export function createIconButtonGroup(): HTMLElement {
  const toolbar = document.createElement('div');
  toolbar.setAttribute('role', 'toolbar');
  toolbar.setAttribute('aria-label', 'Text formatting');

  const buttons = [
    { label: 'Bold', icon: 'B', ariaPressed: false },
    { label: 'Italic', icon: 'I', ariaPressed: false },
    { label: 'Underline', icon: 'U', ariaPressed: false },
  ];

  buttons.forEach(({ label, icon, ariaPressed }) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('aria-label', label);
    button.setAttribute('aria-pressed', String(ariaPressed));
    button.textContent = icon;
    button.className = 'icon-button';

    button.addEventListener('click', () => {
      const pressed = button.getAttribute('aria-pressed') === 'true';
      button.setAttribute('aria-pressed', String(!pressed));
    });

    toolbar.appendChild(button);
  });

  return toolbar;
}

/**
 * Example 7: Custom Select with ARIA Labels
 * Accessible custom dropdown component
 */
export function createCustomSelect(
  label: string,
  options: Array<{ value: string; text: string }>
): HTMLElement {
  const container = document.createElement('div');
  container.className = 'custom-select';

  const labelEl = document.createElement('label');
  labelEl.id = 'select-label';
  labelEl.textContent = label;

  const button = document.createElement('button');
  button.type = 'button';
  button.id = 'select-button';
  button.setAttribute('aria-haspopup', 'listbox');
  button.setAttribute('aria-expanded', 'false');
  button.setAttribute('aria-labelledby', 'select-label select-button');
  button.textContent = 'Select an option';

  const listbox = document.createElement('ul');
  listbox.id = 'select-listbox';
  listbox.setAttribute('role', 'listbox');
  listbox.setAttribute('aria-labelledby', 'select-label');
  listbox.style.display = 'none';

  options.forEach((option, index) => {
    const optionEl = document.createElement('li');
    optionEl.setAttribute('role', 'option');
    optionEl.id = `option-${index}`;
    optionEl.textContent = option.text;
    optionEl.dataset.value = option.value;

    optionEl.addEventListener('click', () => {
      button.textContent = option.text;
      button.setAttribute('aria-expanded', 'false');
      listbox.style.display = 'none';

      // Update selected state
      listbox.querySelectorAll('[role="option"]').forEach(opt => {
        opt.setAttribute('aria-selected', 'false');
      });
      optionEl.setAttribute('aria-selected', 'true');
    });

    listbox.appendChild(optionEl);
  });

  button.addEventListener('click', () => {
    const expanded = button.getAttribute('aria-expanded') === 'true';
    button.setAttribute('aria-expanded', String(!expanded));
    listbox.style.display = expanded ? 'none' : 'block';
  });

  container.appendChild(labelEl);
  container.appendChild(button);
  container.appendChild(listbox);

  return container;
}

/**
 * Example 8: Image with Contextual ARIA Labels
 * Proper labeling for informative images
 */
export function createFigureWithCaption(
  imageSrc: string,
  altText: string,
  caption: string
): HTMLElement {
  const figure = document.createElement('figure');
  figure.setAttribute('role', 'group');
  figure.setAttribute('aria-labelledby', 'fig-caption');

  const img = document.createElement('img');
  img.src = imageSrc;
  img.alt = altText;

  const figcaption = document.createElement('figcaption');
  figcaption.id = 'fig-caption';
  figcaption.textContent = caption;

  figure.appendChild(img);
  figure.appendChild(figcaption);

  return figure;
}

/**
 * Example 9: Complex Widget - Tab Panel
 * Demonstrates comprehensive ARIA labeling for tab interface
 */
export function createTabPanel(tabs: Array<{ id: string; label: string; content: string }>): HTMLElement {
  const container = document.createElement('div');
  container.className = 'tab-container';

  const tablist = document.createElement('div');
  tablist.setAttribute('role', 'tablist');
  tablist.setAttribute('aria-label', 'Content sections');

  const panels = document.createElement('div');
  panels.className = 'tab-panels';

  tabs.forEach((tab, index) => {
    // Create tab button
    const tabButton = document.createElement('button');
    tabButton.setAttribute('role', 'tab');
    tabButton.setAttribute('aria-selected', index === 0 ? 'true' : 'false');
    tabButton.setAttribute('aria-controls', `panel-${tab.id}`);
    tabButton.id = `tab-${tab.id}`;
    tabButton.textContent = tab.label;
    tabButton.type = 'button';

    if (index !== 0) {
      tabButton.setAttribute('tabindex', '-1');
    }

    // Create tab panel
    const panel = document.createElement('div');
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', `tab-${tab.id}`);
    panel.id = `panel-${tab.id}`;
    panel.hidden = index !== 0;
    panel.textContent = tab.content;

    tablist.appendChild(tabButton);
    panels.appendChild(panel);
  });

  container.appendChild(tablist);
  container.appendChild(panels);

  return container;
}

/**
 * Example 10: Navigation Landmark with Label
 * Distinguish multiple navigation regions
 */
export function createLabeledNavigation(label: string, items: string[]): HTMLElement {
  const nav = document.createElement('nav');
  nav.setAttribute('aria-label', label);

  const list = document.createElement('ul');

  items.forEach(item => {
    const li = document.createElement('li');
    const link = document.createElement('a');
    link.href = `#${item.toLowerCase().replace(/\s+/g, '-')}`;
    link.textContent = item;
    li.appendChild(link);
    list.appendChild(li);
  });

  nav.appendChild(list);

  return nav;
}

// Usage examples
if (typeof window !== 'undefined') {
  // Example usage in a web page
  document.addEventListener('DOMContentLoaded', () => {
    console.log('ARIA Label Examples - WCAG 2.1 Compliant');

    // Example: Create accessible form
    const form = document.createElement('form');
    form.appendChild(createAccessibleFormField('Email', 'email', 'email', true));
    form.appendChild(createPasswordFieldWithValidation());

    // Example: Add icon buttons
    const toolbar = createIconButtonGroup();

    // Example: Add custom select
    const select = createCustomSelect('Choose a color', [
      { value: 'red', text: 'Red' },
      { value: 'blue', text: 'Blue' },
      { value: 'green', text: 'Green' },
    ]);

    console.log('Created accessible components with proper ARIA labels');
  });
}
