from selectolax.parser import HTMLParser

def clean_summary(text: str) -> str:
    """
    Cleans a raw article summary by stripping HTML tags, 
    normalizing whitespace, and capping the length at 280 characters.
    """
    if not text:
        return ""
    
    # Strip HTML tags using selectolax
    parser = HTMLParser(text)
    plain_text = parser.text() or ""
    
    # Normalize whitespace (replace tabs, newlines, and multiple spaces with a single space)
    words = plain_text.split()
    normalized = " ".join(words)
    
    # Cap length at 280 characters
    if len(normalized) > 280:
        normalized = normalized[:277] + "..."
        
    return normalized
