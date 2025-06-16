'use client';
import { useState, useRef, useEffect } from 'react';
import { FaMicrophone, FaStop, FaQrcode } from 'react-icons/fa';
import QRCode from 'react-qr-code';
import styles from './page.module.css';

interface Story {
  id: string;
  title: string;
  videoId: string;
  status:  'Running' | 'Completed' | 'Failed';
  fullPrompt: string; // Added field to store the full prompt
}

interface QRModalProps {
  videoUrl: string;
  onClose: () => void;
  isOpen: boolean;
}

// Helper function to convert relative URLs to absolute URLs
const getAbsoluteUrl = (url: string): string => {
  // Check if the URL is already absolute
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('s3://')) {
    return url;
  }
  
  // If it's a relative URL, convert it to absolute
  const baseUrl = window.location.origin;
  return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
};

const QRModal: React.FC<QRModalProps> = ({ videoUrl, onClose, isOpen }) => {
  if (!isOpen) return null;
  
  // Convert to absolute URL for QR code
  const absoluteUrl = getAbsoluteUrl(videoUrl);

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>Scan QR Code to View Video</h3>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>
        <div className={styles.qrCodeContainer}>
          <QRCode value={absoluteUrl} size={256} />
        </div>
        <p className={styles.modalInstructions}>
          Scan this QR code with your phone's camera to watch the video on your mobile device
        </p>
      </div>
    </div>
  );
};

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [currentVideoId, setCurrentVideoId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const playerRef = useRef<any>(null);


  // Default stories with YouTube video IDs
  const defaultStories: Story[] = [
    {
      id: '1',
      title: 'Liitle baby bird learning to fly',
      videoId: '/samples/sample1.mp4', // Replace with your S3 URL
      status: 'Completed',
      fullPrompt: 'Liitle baby bird learning to fly' // Using title as full prompt
    },
    {
      id: '2',
      title: 'Ad Marketing Indian Spices',
      videoId: '/samples/sample2.mp4', // Replace with your S3 URL
      status: 'Completed',
      fullPrompt: 'Ad Marketing Indian Spices'
    },
    {
      id: '3',
      title: 'Adventure of Dumbo',
      videoId: '/samples/sample3.mp4', // Replace with your S3 URL
      status: 'Completed',
      fullPrompt: 'Adventure of Dumbo'
    },
    {
      id: '4',
      title: 'The Science of Monsoon- An educational tale',
      videoId: '/samples/sample4.mp4', // Replace with your S3 URL
      status: 'Completed',
      fullPrompt: 'The Science of Monsoon- An educational tale'
    },
    {
      id: '5',
      title: 'Marketing - Farm to Phone',
      videoId: '/samples/sample5.mp4', // Replace with your S3 URL
      status: 'Completed',
      fullPrompt: 'Marketing - Farm to Phone'
    },
    {
      id: '6',
      title: 'Smart Banking for everyone',
      videoId: '/samples/sample6.mp4', // Replace with your S3 URL
      status: 'Completed',
      fullPrompt: 'Smart Banking for everyone'
    },
    {
      id: '7',
      title: 'Green Earth Warriors - Educations Video Kids',
      videoId: '/samples/sample7.mp4', // Replace with your S3 URL
      status: 'Completed',
      fullPrompt: 'Green Earth Warriors - Educations Video Kids'
    },
    {
      id: '8',
      title: 'Technical Farmer (Training)',
      videoId: '/samples/sample8.mp4', // Replace with your S3 URL
      status: 'Completed',
      fullPrompt: 'Technical Farmer (Training)'
    },
    {
      id: '9',
      title: 'Performance Review Tips (Training) ',
      videoId: '/samples/sample9.mp4', // Replace with your S3 URL
      status: 'Completed',
      fullPrompt: 'Performance Review Tips (Training) '
    }
  ];

  const [stories, setStories] = useState<Story[]>(defaultStories);
  const statusCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
 // Helper function to get first four words
 const getFirstFourWords = (text: string): string => {
  const words = text.trim().split(/\s+/);
  return words.slice(0, 4).join(' ') + (words.length > 4 ? '...' : '');
};

const generateStory = async () => {
  if (!prompt.trim()) return; // Don't process empty prompts

  setIsLoading(true);
  try {
    // Make API call to generate story
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        topic: prompt
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    console.log('API response:', data);
    
    // Extract story_id from response and use it for the title
    // Format the story_id to make it more readable as a title
    const storyTitle = data.story_id 
      ? data.story_id.replace(/_/g, ' ') // Replace underscores with spaces for better readability
      : getFirstFourWords(prompt); // Fallback to first four words if no story_id
    
    // Create new story with the title from API response
    const newStory = {
      id: data.executionArn || Date.now().toString(),
      title: storyTitle,
      videoId: '', // For demo, randomly select from default videos
      status: 'Running' as const, // Set initial status to INPROGRESS
      fullPrompt: prompt // Store the full prompt
      // In a real implementation, you might want to use a video URL from the API response
    };

          // In generateStory function
      setStories(prevStories => {
        const newStories = [newStory, ...prevStories];
        
        // Ensure the status checking interval is running
        if (!statusCheckIntervalRef.current) {
          console.log('Setting up status check interval');
          statusCheckIntervalRef.current = setInterval(checkAllInProgressStories, 20000);
        }
        
        return newStories;
      });
 //   setCurrentVideoId(data.executionArn); // Auto-play the new story
    setPrompt(''); // Clear the prompt input

  } catch (error) {
    console.error('Error generating story:', error);
    alert('Failed to generate story. Please try again.');
  }
  setIsLoading(false);
};

// Function to check status of a single story
const checkStoryStatus = async (storyId: string) => {
  try {
    const response = await fetch('/api/generate?executionArn='+storyId, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Status check failed with status ${response.status}`);
    }

    const data = await response.json();
    console.log(`Status for story ${storyId}:`, data);
    
    
    // Update the story status in the state
    // Update the story status in the state
      setStories(prevStories => 
        prevStories.map(story => {
          if (story.id === storyId) {
            // Determine the status based on the API response
            let newStatus: 'Running' | 'Completed' | 'Failed';
            
            if (data.status === 'SUCCEEDED') {
              newStatus = 'Completed';
            } else if (data.status === 'Failed') {
              newStatus = 'Failed';
            } else {
              newStatus = 'Running';
            }
            
            // Create updated story object
            const updatedStory = {
              ...story,
              status: newStatus
            };
            
            // If status is COMPLETED and there's a video URL, update the videoId , remove word output from below if want ti use previous version
            if (newStatus === 'Completed' && data.output.final_output_location) {
              updatedStory.videoId = data.output.final_output_location;
            }
            
            return updatedStory;
          }
          return story;
        })
      );

    return data.status;
  } catch (error) {
    console.error(`Error checking status for story ${storyId}:`, error);
    return 'FAILED';
  }
};

// Function to check all in-progress stories
// Add a ref to track the current stories
const storiesRef = useRef<Story[]>(defaultStories);

// Update the ref whenever stories change
useEffect(() => {
  storiesRef.current = stories;
}, [stories]);

// Modify checkAllInProgressStories to use the ref
const checkAllInProgressStories = async () => {
  // Use the ref to get the latest stories
  const inProgressStories = storiesRef.current.filter(story => story.status === 'Running');
  
  console.log('Checking status for in-progress stories:', inProgressStories.length);
  
  if (inProgressStories.length === 0) {
    // If no in-progress stories, clear the interval
    if (statusCheckIntervalRef.current) {
      clearInterval(statusCheckIntervalRef.current);
      statusCheckIntervalRef.current = null;
      console.log('No in-progress stories, clearing interval');
    }
    return;
  }

  // Check each in-progress story
  for (const story of inProgressStories) {
    await checkStoryStatus(story.id);
  }
};

// Start the status checking when component mounts
useEffect(() => {
  // Check if there are any in-progress stories
  const inProgressStories = stories.filter(story => story.status === 'Running');
  
  // Set up interval to check status every 15 seconds if there are in-progress stories
  if (inProgressStories.length > 0 && !statusCheckIntervalRef.current) {
    console.log('Setting up initial status check interval');
    statusCheckIntervalRef.current = setInterval(checkAllInProgressStories, 15000);
  }

  // Clean up interval on unmount
  return () => {
    if (statusCheckIntervalRef.current) {
      clearInterval(statusCheckIntervalRef.current);
      statusCheckIntervalRef.current = null;
    }
  };
}, []); // Empty dependency array - only run once on mount

  
// Initialize Video Player
useEffect(() => {
  // Initialize the video player reference to the HTML element
  playerRef.current = document.getElementById('video-player');
  
  // Set the initial video if there are completed stories with videos
  const completedStories = stories.filter(story => 
    story.status === 'Completed' && story.videoId
  );
  
  if (completedStories.length > 0 && completedStories[0].videoId) {
    setCurrentVideoId(completedStories[0].videoId);
  }
}, []);


  
const playVideo = (videoId: string) => {
  if (videoId) { // Only set the video source if videoId is not empty
    const videoPlayer = document.getElementById('video-player') as HTMLVideoElement;
    if (videoPlayer) {
      videoPlayer.src = videoId;
      videoPlayer.load();
      videoPlayer.play().catch(error => {
        console.error('Error playing video:', error);
      });
    }
    setCurrentVideoId(videoId);
  }
};

  
  
  

  // Count words in a string
  const countWords = (text: string): number => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    const wordCount = countWords(newText);
    
    // Only update if within word limit or if deleting text
    if (wordCount <= 10 || newText.length < prompt.length) {
      setPrompt(newText);
    }
  };
  
  // Calculate current word count
  const wordCount = countWords(prompt);



  return (
    <>
      <nav className={styles.navbar}>
        <div className={styles.navContent}>
          <h1 className={styles.navTitle}>AI Story Teller : From Text to Visual Tales</h1>
        </div>
      </nav>
      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.leftColumn}>
            <div className={styles.videoSection}>
              <div className={styles.videoWrapper}>
                <video 
                  id="video-player" 
                  controls 
                  className={styles.videoPlayer}
                  width="100%"
                  height="auto"
                  key={currentVideoId} // Add a key to force re-render when video changes
                  >
                   {currentVideoId ? (
                      <source src={currentVideoId} type="video/mp4" />
                    ) : null}
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>            
            <div className={styles.inputSection}>
              <div className={styles.textareaContainer}>
                <textarea
                  value={prompt}
                  onChange={handlePromptChange}
                  placeholder="Enter your story prompt here (max 10 words)..."
                  className={styles.promptInput}
                  aria-label="Story prompt input"
                />
                <div className={styles.wordCount} style={{ color: wordCount === 10 ? '#ff4500' : '#666' }}>
                  {wordCount}/10 words
                </div>
              </div>
              <div className={styles.buttonGroup}>
                <button
                  onClick={generateStory}
                  disabled={!prompt || isLoading}
                  className={styles.button}
                  aria-label="Generate story"
                >
                  {isLoading ? 'Generating...' : 'Generate My Story'}
                </button>
              </div>
            </div>
          </div>
  
          <div className={styles.rightColumn}>
            <div className={styles.storiesList}>
              <h2>Your Stories</h2>
              <div className={styles.storiesScroll}>
              {stories.map((story) => (
                <div key={story.id} className={styles.storyItemContainer}>
                  <button
                    onClick={() => story.videoId ? playVideo(story.videoId) : null}
                    className={`${styles.storyItem} ${
                      currentVideoId === story.videoId ? styles.activeStory : ''
                    }`}
                    aria-label={`Play story: ${story.title}`}
                    disabled={!story.videoId || story.status !== 'Completed'} // Disable button if no video or not completed
                    data-full-prompt={story.fullPrompt} // Add data attribute for tooltip
                  >
                    {story.title}
                    {story.status === 'Running' && (
                      <span 
                      className={`${styles.statusDot} ${styles.runningDot}`} 
                      title="Processing"
                      aria-label="Processing"
                    ></span>
                    )}
                    {story.status === 'Completed' && (
                      <span 
                      className={`${styles.statusDot} ${styles.completedDot}`} 
                      title="Completed"
                      aria-label="Completed"
                    ></span>
                    )}
                    {story.status === 'Failed' && (
                    <span 
                    className={`${styles.statusDot} ${styles.failedDot}`} 
                    title="Failed"
                    aria-label="Failed"
                  ></span>
                    )}
                  </button>
                  {story.status === 'Completed' && story.videoId && (
                    <button 
                      className={styles.qrButton}
                      onClick={() => {
                        setQrCodeUrl(story.videoId);
                        setShowQRModal(true);
                      }}
                      aria-label="Show QR code"
                      title="Scan QR code to view on mobile"
                    >
                      <FaQrcode />
                    </button>
                  )}
                </div>
              ))}
              </div>
            </div>
          </div>
        </div>
      </main>
      <QRModal 
        videoUrl={qrCodeUrl} 
        onClose={() => setShowQRModal(false)} 
        isOpen={showQRModal} 
      />
    </>
  );  
}
