
import os

file_path = r'c:\Users\omars\Downloads\UPLINK\src\app\page.tsx'
corrupted_block = '<div className={`min-h-screen relative ${theme === \'light\' ? \'text-[#1a1a2e]\' : \'text-gray-200\'} selection:bg-[#ff007f]/30 font-[family-name:var(--font-outfit)] overflow-x-hidden bg-black`}> <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden"><motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 60, repeat: Infinity }} className="w-full h-full"><img src="/vibrant_galaxy_v2_1778225408385.png" className="w-full h-full object-cover opacity-60" /></motion.div><div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80"></div></div> <div className="relative z-10">'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

count = content.count(corrupted_block)
print(f"Found {count} occurrences of the corrupted block.")

# Try to clean it up
# Pattern 1: ( <BLOCK>  -> (
# Pattern 2: ( <BLOCK>) -> ()

new_content = content.replace(corrupted_block, "")

# Also check for trailing </div> that might have been added? 
# In RoleCard (line 15-62), it opened 3 extra divs.
# <div wrapper> <div fixed bg> <div relative z-10>
# If I remove them from line 15, I don't need to remove </div> at line 62?
# Let's check line 60-62.
# 60:       </div>
# 61:    );
# 62: };
# There were 3 </div>s in RoleCard correctly closing the intended content.
# But line 15 inserted 3 MORE <div>s. 
# So there should be 3 unclosed <div>s or 3 extra </div>s somewhere.
# User's error: Unexpected token at line 62. 
# This is because the parser reached line 62 while still inside the divs opened at line 15.

with open(file_path + '.clean', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Created page.tsx.clean")
