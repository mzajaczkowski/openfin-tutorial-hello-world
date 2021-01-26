
class TrieNode {
    constructor() {
      this.frequency = 0;
      this.children = new Map();
    }
  
    bumpFrequency() {
      this.frequency++;
    }
  
    getOrCreateChild(index) {
      if (!this.children.has(index)) {
        this.children.set(index, new TrieNode());
      }
      return this.getChild(index);    
    }
  
    getChild(index) {
      console.assert(this.children.has(index));
      return this.children.get(index);
    }
  };
  
  class Trie {
    constructor() {
      this.root = new TrieNode();
    }
  
    insert(newString) {
      let currentNode = this.root;
      for (let level = 0; level < newString.length; level++) {
        const childIndex = newString.charAt(level);
        let child = currentNode.getOrCreateChild(childIndex);
        child.bumpFrequency();
        currentNode = child;
      }
    }
  
    getPrefix(inputString) {
      return this.traverseNode(this.root, inputString);
    }
  
    traverseNode(node, inputString) {
      console.warn(`${inputString} ${node.frequency}`);
      if (node.frequency === 1 || inputString.length === 0) {
        return '';
      }
      let childNode = node.getChild(inputString.charAt(0));
      return `${inputString.charAt(0)}${this.traverseNode(childNode, inputString.substring(1))}`;
    }
  };


