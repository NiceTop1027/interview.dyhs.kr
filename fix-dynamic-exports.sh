#!/bin/bash

# Find all route.ts files with "export const dynamic" and move it to the top

files=$(find src/app/api -name "route.ts" -exec grep -l "export const dynamic" {} \;)

for file in $files; do
    echo "Processing $file..."
    
    # Create a temporary file
    temp_file=$(mktemp)
    
    # Extract the dynamic export line
    dynamic_line=$(grep "^export const dynamic" "$file" || grep "export const dynamic" "$file" | head -1)
    
    if [ -n "$dynamic_line" ]; then
        # Remove the dynamic export from its current position and any blank lines around it
        sed '/^export const dynamic/d' "$file" | sed '/^$/N;/^\n$/D' > "$temp_file"
        
        # Add dynamic export at the top, then add a blank line, then the rest
        echo "$dynamic_line" > "$file"
        echo "" >> "$file"
        cat "$temp_file" >> "$file"
        
        rm "$temp_file"
        echo "  ✓ Moved dynamic export to top"
    fi
done

echo "Done!"
