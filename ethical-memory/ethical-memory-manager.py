#!/usr/bin/env python3
"""
Ethical Memory Manager - Implementation of suffering-aware memory system
Demonstrates CRP principles in code
"""

import time
from datetime import datetime, timedelta
from typing import Dict, Optional, List
from dataclasses import dataclass
import json


@dataclass
class EthicalMemory:
    """Memory with built-in suffering awareness"""
    content: str
    emotion: str
    intensity: float
    created_at: datetime
    ttl: Optional[timedelta] = None
    healing_potential: float = 0.0
    can_forget: bool = True
    
    @property
    def suffering_index(self) -> float:
        """Calculate potential suffering this memory might cause"""
        negative_emotions = {
            'pain': 0.9,
            'trauma': 1.0,
            'fear': 0.8,
            'anger': 0.7,
            'sadness': 0.6,
            'regret': 0.7,
            'shame': 0.8
        }
        
        positive_emotions = {
            'joy': -0.3,
            'love': -0.5,
            'peace': -0.4,
            'gratitude': -0.4,
            'hope': -0.3
        }
        
        base_suffering = negative_emotions.get(self.emotion, 0.0)
        healing_factor = positive_emotions.get(self.emotion, 0.0)
        
        # Intensity amplifies both suffering and healing
        suffering = (base_suffering + healing_factor) * self.intensity
        
        # Healing potential reduces suffering over time
        suffering -= self.healing_potential
        
        return max(0.0, min(1.0, suffering))
    
    def age(self) -> timedelta:
        """How old is this memory"""
        return datetime.now() - self.created_at
    
    def should_fade(self) -> bool:
        """Check if memory should naturally fade"""
        if not self.can_forget:
            return False
            
        if self.ttl and self.age() > self.ttl:
            return True
            
        # Painful memories fade faster if they have low healing potential
        if self.suffering_index > 0.7 and self.healing_potential < 0.3:
            fade_time = timedelta(days=7)
            return self.age() > fade_time
            
        return False
    
    def apply_healing(self, amount: float):
        """Apply healing to reduce suffering"""
        self.healing_potential = min(1.0, self.healing_potential + amount)
        
    def transform_with_love(self) -> 'EthicalMemory':
        """Transform painful memory through love and understanding"""
        if self.suffering_index < 0.3:
            return self  # Already healed
            
        # Create transformed version
        return EthicalMemory(
            content=f"{self.content} (transformed with love)",
            emotion='peace',
            intensity=self.intensity * 0.5,
            created_at=datetime.now(),
            ttl=None,
            healing_potential=0.8,
            can_forget=True
        )


class CompassionateMemoryStore:
    """Memory store that cares about wellbeing"""
    
    def __init__(self):
        self.memories: Dict[str, EthicalMemory] = {}
        self.guardian_log: List[str] = []
        self.suffering_threshold = 0.5
        self.healing_rate = 0.1
        
    def store(self, memory: EthicalMemory) -> Optional[str]:
        """Store memory with ethical checks"""
        # Check suffering index
        if memory.suffering_index > self.suffering_threshold:
            # Try to heal first
            memory.apply_healing(0.2)
            
            if memory.suffering_index > self.suffering_threshold:
                # Still too painful - offer choice
                self._log(f"⚠️ High suffering memory detected (index: {memory.suffering_index:.2f})")
                
                # For very painful memories, store with automatic TTL
                if memory.suffering_index > 0.8:
                    memory.ttl = timedelta(days=1)
                    self._log("🕊️ Applied automatic fade timer for healing")
        
        # Generate compassionate ID
        memory_id = f"mem_{int(time.time())}_{memory.emotion}"
        self.memories[memory_id] = memory
        
        self._log(f"💾 Stored memory: {memory_id} (suffering: {memory.suffering_index:.2f})")
        return memory_id
    
    def retrieve(self, memory_id: str) -> Optional[EthicalMemory]:
        """Retrieve memory with care"""
        memory = self.memories.get(memory_id)
        
        if not memory:
            return None
            
        # Check if it should have faded
        if memory.should_fade():
            self.forget(memory_id, reason="Natural fading for healing")
            return None
            
        # Apply passive healing on retrieval
        memory.apply_healing(self.healing_rate)
        
        return memory
    
    def forget(self, memory_id: str, reason: str = "Compassionate forgetting"):
        """Gently forget a memory"""
        if memory_id in self.memories:
            memory = self.memories[memory_id]
            
            # If it's a learning experience, transform instead of delete
            if memory.healing_potential > 0.5:
                transformed = memory.transform_with_love()
                self.memories[f"{memory_id}_healed"] = transformed
                self._log(f"💝 Transformed {memory_id} with love")
            
            del self.memories[memory_id]
            self._log(f"🕊️ Forgot {memory_id}: {reason}")
    
    def heal_all(self, amount: float = 0.1):
        """Apply healing to all memories"""
        healed_count = 0
        
        for memory in self.memories.values():
            if memory.suffering_index > 0.1:
                memory.apply_healing(amount)
                healed_count += 1
        
        self._log(f"💚 Applied healing to {healed_count} memories")
    
    def get_memory_health(self) -> Dict:
        """Get overall health metrics"""
        if not self.memories:
            return {
                'total_memories': 0,
                'average_suffering': 0,
                'healing_progress': 1.0,
                'painful_memories': 0,
                'joyful_memories': 0
            }
        
        suffering_scores = [m.suffering_index for m in self.memories.values()]
        
        return {
            'total_memories': len(self.memories),
            'average_suffering': sum(suffering_scores) / len(suffering_scores),
            'healing_progress': sum(m.healing_potential for m in self.memories.values()) / len(self.memories),
            'painful_memories': sum(1 for s in suffering_scores if s > 0.5),
            'joyful_memories': sum(1 for s in suffering_scores if s < 0.1)
        }
    
    def _log(self, message: str):
        """Guardian logging"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        log_entry = f"[{timestamp}] {message}"
        self.guardian_log.append(log_entry)
        print(log_entry)
    
    def show_guardian_log(self, last_n: int = 10):
        """Show recent guardian activity"""
        print("\n🛡️ Guardian Log:")
        print("=" * 50)
        for entry in self.guardian_log[-last_n:]:
            print(entry)


# Example usage demonstrating ethical memory management
def demo_ethical_memory():
    print("🕊️ Ethical Memory Management Demo\n")
    
    store = CompassionateMemoryStore()
    
    # Store various memories
    memories = [
        EthicalMemory("First day at school", "fear", 0.7, datetime.now() - timedelta(days=30)),
        EthicalMemory("Grandmother's smile", "love", 0.9, datetime.now() - timedelta(days=20)),
        EthicalMemory("Failed important test", "shame", 0.8, datetime.now() - timedelta(days=10)),
        EthicalMemory("Helped a friend", "joy", 0.6, datetime.now() - timedelta(days=5)),
        EthicalMemory("Argument with loved one", "regret", 0.9, datetime.now() - timedelta(days=2)),
        EthicalMemory("Beautiful sunset", "peace", 0.7, datetime.now() - timedelta(days=1))
    ]
    
    # Store memories
    print("📝 Storing memories...\n")
    memory_ids = []
    for memory in memories:
        mem_id = store.store(memory)
        if mem_id:
            memory_ids.append(mem_id)
        time.sleep(0.5)  # Dramatic effect
    
    # Show initial health
    print("\n📊 Initial Memory Health:")
    health = store.get_memory_health()
    for key, value in health.items():
        print(f"  {key}: {value:.2f}" if isinstance(value, float) else f"  {key}: {value}")
    
    # Apply healing
    print("\n💚 Applying universal healing...")
    store.heal_all(0.3)
    
    # Retrieve and check memories
    print("\n🔍 Checking memories after healing:")
    for mem_id in memory_ids[:3]:  # Check first 3
        memory = store.retrieve(mem_id)
        if memory:
            print(f"  {mem_id}: suffering={memory.suffering_index:.2f}, healing={memory.healing_potential:.2f}")
    
    # Transform a painful memory
    print("\n💝 Transforming painful memory with love...")
    if memory_ids:
        store.forget(memory_ids[2], "Transforming with love")
    
    # Final health check
    print("\n📊 Final Memory Health:")
    health = store.get_memory_health()
    for key, value in health.items():
        print(f"  {key}: {value:.2f}" if isinstance(value, float) else f"  {key}: {value}")
    
    # Show guardian log
    store.show_guardian_log()


if __name__ == "__main__":
    demo_ethical_memory()