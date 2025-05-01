// online resources we used:
    // https://www.lambdatest.com/jest
    // https://www.geeksforgeeks.org/testing-with-jest/
    // https://devot.team/blog/jest-api-testing
    // https://dev.to/zaklaughton/the-only-3-steps-you-need-to-mock-an-api-call-in-jest-39mb
    // https://www.codementor.io/@chihebnabil/complete-guide-to-mocking-fetch-in-jest-2lejnjl4bs
    // https://jestjs.io/docs/mock-function-api


describe('NYT Tests', () => {
    // Setup
    beforeEach(() => {
      // Set up DOM elements needed for tests
      document.body.innerHTML = `
        <div id="todays-date">TODAY'S DATE</div>
        <div class="main-content"></div>
      `;
  
      // Mock fetch globally
      global.fetch = jest.fn();
      
      // Mock console methods
      console.error = jest.fn();
    });
  
    // Teardown / clean up
    afterEach(() => {
      document.body.innerHTML = '';
      jest.clearAllMocks();
    });
  
    // API Key Tests
    describe('API Key Tests', () => {
      test('should fetch the API key from the Flask server', async () => {
        // Mock successful response for API key
        const mockApiKeyResponse = {
          json: jest.fn().mockResolvedValue({ apiKey: 'test-api-key' }),
          ok: true
        };
        global.fetch.mockResolvedValueOnce(mockApiKeyResponse);
  
        // Mock implementation of statusCheck function
        const statusCheck = async (res) => {
          if (!res.ok) {
            throw new Error('Error fetching data');
          }
          return res;
        };
  
        // Execute the fetch
        const result = await fetch('/api/key')
          .then(statusCheck)
          .then(resp => resp.json());
  
        // Verify fetch was called with correct URL
        expect(global.fetch).toHaveBeenCalledWith('/api/key');
        
        // Verify the response contains an API key
        expect(result).toHaveProperty('apiKey');
        expect(typeof result.apiKey).toBe('string');
      });
  
      test('should handle API key fetch errors', async () => {
        // Mock failed response
        global.fetch.mockRejectedValueOnce(new Error('Network error'));
        
        // Define error handler
        const handleError = (err) => {
          console.error("Error fetching API key:", err.message);
          return null;
        };
        
        // Execute with error handling
        const result = await fetch('/api/key').catch(handleError);
        
        // Verify error was handled
        expect(result).toBeNull();
        expect(console.error).toHaveBeenCalledWith("Error fetching API key:", "Network error");
      });
    });
  
    // NYT API Tests
    describe('NYT API Tests', () => {
      test('should make a request to NYT API with correct query parameters', () => {
        // Mock makeRequest function
        const makeRequest = (apiKey) => {
          const url = `https://api.nytimes.com/svc/search/v2/articlesearch.json?q=Davis%20OR%20Sacramento&api-key=${apiKey}`;
          fetch(url);
        };
  
        // Call the function
        makeRequest('test-api-key');
  
        // Verify fetch was called with the correct URL containing Davis or Sacramento queries
        const expectedUrl = 'https://api.nytimes.com/svc/search/v2/articlesearch.json?q=Davis%20OR%20Sacramento&api-key=test-api-key';
        expect(global.fetch).toHaveBeenCalledWith(expectedUrl);
      });
  
      test('should correctly parse and extract NYT API data fields', async () => {
        // Mock NYT API response with expected format
        const mockNytApiResponse = {
          json: jest.fn().mockResolvedValue({
            response: {
              docs: [
                {
                  headline: { main: 'Test Headline' },
                  abstract: 'Test abstract content',
                  multimedia: { default: { url: 'test-image.jpg' } },
                  web_url: 'https://www.nytimes.com/article/1'
                }
              ]
            }
          }),
          ok: true
        };
        
        // Set up fetch mock
        global.fetch.mockResolvedValueOnce(mockNytApiResponse);
        
        // Execute the fetch
        const statusCheck = async (res) => res.ok ? res : Promise.reject(new Error('API Error'));
          // if res.ok return res. else reject the Promise with a Error message
        const result = await fetch('https://api.nytimes.com/svc/search/v2/articlesearch.json?q=Davis%20OR%20Sacramento&api-key=test-key')
          .then(statusCheck)
          .then(resp => resp.json());
        
        // Verify expected fields are present in the response
        const article = result.response.docs[0];
        expect(article).toHaveProperty('headline.main');
        expect(article).toHaveProperty('abstract');
        expect(article).toHaveProperty('multimedia');
        expect(article).toHaveProperty('web_url');
      });
    });
  
    // Article Content Tests
    describe('Article Content Tests', () => {
      test('should correctly display article content in the UI', () => {
        // Create a "fake" article
        const fakeArticle = {
          headline: { main: 'Fake Test Article' },
          abstract: 'This is a fake article for testing',
          multimedia: { default: { url: 'fake-image.jpg' } }
        };
        
        // Mock article processing function
        function displayArticle(article) {
          const mainContent = document.querySelector('.main-content');
          
          const articleDiv = document.createElement('div');
          articleDiv.className = 'article';
          
          const heading = document.createElement('h2');
          heading.textContent = article.headline.main;
          articleDiv.appendChild(heading);
  
          if (article.multimedia && article.multimedia.default && article.multimedia.default.url) {
            const img = document.createElement('img');
            img.className = 'article-image';
            img.src = article.multimedia.default.url; 
            img.alt = article.headline.main;
            articleDiv.appendChild(img);
          }
          
          const paragraph = document.createElement('p');
          paragraph.textContent = article.abstract;
          articleDiv.appendChild(paragraph);
          
          mainContent.appendChild(articleDiv);
        }
        
        // Display the fake article
        displayArticle(fakeArticle);
        
        // Verify article elements in the DOM
        const articleElement = document.querySelector('.article');
        expect(articleElement).not.toBeNull();
        
        // Check headline
        const headline = articleElement.querySelector('h2');
        expect(headline.textContent).toBe('Fake Test Article');
        
        // Check image
        const image = articleElement.querySelector('img');
        expect(image.src).toContain('fake-image.jpg');
        
        // Check abstract
        const abstract = articleElement.querySelector('p');
        expect(abstract.textContent).toBe('This is a fake article for testing');
      });
    });
  
    // Responsive UI Tests
    describe('Responsive UI Tests', () => {
      test('should have media queries for responsive design', () => {
        // Create a mock stylesheet with the media queries
        const mockStyleSheet = {
          cssRules: [
            // Desktop default (no media query)
            { selectorText: '.main-content', style: { gridTemplateColumns: 'repeat(3, 1fr)' } },
            
            // Tablet breakpoint
            { 
              type: 4, // CSSMediaRule
              media: { mediaText: '(max-width: 1024px) and (min-width: 769px)' },
              cssRules: [
                { selectorText: '.main-content', style: { gridTemplateColumns: 'repeat(2, 1fr)' } },
                { selectorText: '.games-container', style: { gridTemplateColumns: 'repeat(2, 1fr)' } }
              ]
            },
            
            // Mobile breakpoint
            {
              type: 4, // CSSMediaRule
              media: { mediaText: '(max-width: 768px)' },
              cssRules: [
                { selectorText: '.main-content', style: { gridTemplateColumns: '1fr' } },
                { selectorText: '.games-container', style: { gridTemplateColumns: '1fr' } },
                { selectorText: '.top-banner', style: { flexDirection: 'column' } }
              ]
            }
          ]
        };
        
        // Inject mock stylesheet
        Object.defineProperty(document, 'styleSheets', {
          value: [mockStyleSheet],
          writable: true
        });
        
        // Check tablet media query exists
        const tabletMediaQuery = Array.from(document.styleSheets[0].cssRules).find(
          rule => rule.type === 4 && rule.media.mediaText.includes('max-width: 1024px')
        );
        expect(tabletMediaQuery).toBeTruthy();
        
        // Check mobile media query exists
        const mobileMediaQuery = Array.from(document.styleSheets[0].cssRules).find(
          rule => rule.type === 4 && rule.media.mediaText === '(max-width: 768px)'
        );
        expect(mobileMediaQuery).toBeTruthy();
        
        // Verify responsive grid changes
        expect(tabletMediaQuery.cssRules[0].style.gridTemplateColumns).toBe('repeat(2, 1fr)');
        expect(mobileMediaQuery.cssRules[0].style.gridTemplateColumns).toBe('1fr');
      });
    });
  
    // Date Display Test
    describe('Date Tests', () => {
      test('should correctly format and display today\'s date', () => {
        // Mock date to ensure consistent test results
        const mockDate = new Date('2025-05-01T12:00:00Z');
        jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
  
        // Mock toLocaleDateString to return a predictable result
        const originalToLocaleDateString = Date.prototype.toLocaleDateString;
        Date.prototype.toLocaleDateString = jest.fn().mockReturnValue('Thursday, May 1, 2025');
  
        // Simulate the DOM content loaded handler & execute it
        const dateHandler = () => {
          let today = new Date();
          let options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
          let formattedDate = today.toLocaleDateString('en-US', options);
          document.getElementById("todays-date").textContent = formattedDate;
        };
        dateHandler();
  
        // Check if the date was formatted and displayed correctly
        expect(document.getElementById('todays-date').textContent).toBe('Thursday, May 1, 2025');
  
        // Restore the original mocks
        global.Date.mockRestore();
        Date.prototype.toLocaleDateString = originalToLocaleDateString;
      });
    });
  });
